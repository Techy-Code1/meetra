import { ApiError }    from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import bcrypt           from "bcrypt";
import crypto           from "crypto";
import prisma           from "../db/index.js";
import sendOTPEmail     from "../utils/mailer.js";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt.js";
import { decrypt } from "dotenv";

// Common cookie configuration for authentication tokens
   const options = {
    // httpOnly prevents JavaScript access (XSS protection)
        httpOnly : true ,
    // secure ensures cookies are sent only over HTTPS (production)
        secure : false ,
        sameSite: "lax",
    }

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

// generate otp pin randomly
const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

// hash and encrypt the security key
const hashToken = (raw) =>
  crypto.createHash("sha256").update(raw).digest("hex");

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const nameRegex = /^[A-Za-z]+(?:[ '-][A-Za-z]+)*$/;
const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d\s]).{8,}$/;
const otpRegex = /^\d{6}$/;

const normalizeEmail = (email = "") => email.trim().toLowerCase();
const normalizeName = (name = "") => name.trim().replace(/\s+/g, " ");

// ------------------------------------------------
// This Method helps to track user for forensics 
// ------------------------------------------------
const logAuthEvent = async (user_id, action, req, status = "success") => {
  try {
    await prisma.authenticationLog.create({
      data: {
        user_id,
        action,
        ip_address: req.ip || req.headers["x-forwarded-for"] || null,
        user_agent: req.headers["user-agent"] || null,
        status,
      },
    });
  } catch (e) {
    console.error("Auth log failed:", e.message);
  }
};


// ─────────────────────────────────────────────
// REFRESH ACCESS TOKEN
// ─────────────────────────────────────────────

/**
 * POST /api/v1/users/refresh-token
 *
 * Reads refreshToken from cookie or body.
 * Verifies JWT signature → looks up hashed token in DB →
 * issues new accessToken (+ optionally rotates refreshToken).
 */
const refreshAccessToken = asyncHandler(async (req, res) => {
  // ── 1. Extract raw refresh token ──
  const incomingRefreshToken =
    req.cookies?.refreshToken || req.body?.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Refresh token is required");
  }

  // ── 2. Verify JWT signature & expiry ──
  let decoded;
  try {
    decoded = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
  } catch (err) {
    throw new ApiError(401, "Invalid or expired refresh token");
  }

  // ── 3. Find user ──
  const user = await prisma.user.findUnique({
    where: { user_id: decoded.user_id },
  });

  if (!user || !user.is_verified || !user.is_active || user.is_deleted) {
    throw new ApiError(403, "User not found or account inactive");
  }

  // ── 4. Look up the hashed token in DB ──
  const hashedIncoming = hashToken(incomingRefreshToken);

  const storedToken = await prisma.refreshToken.findFirst({
    where: {
      user_id:    user.user_id,
      token:      hashedIncoming,
      is_revoked: false,
    },
    orderBy: { created_at: "desc" },
  });

  if (!storedToken) {
    throw new ApiError(401, "Refresh token not recognised — please login again");
  }

  if (storedToken.expires_at < new Date()) {
    // Clean up expired token
    await prisma.refreshToken.delete({ where: { id: storedToken.id } });
    throw new ApiError(401, "Refresh token expired — please login again");
  }

  // ── 5. Rotate: revoke old token, issue new pair ──
  const newAccessToken  = generateAccessToken(user);
  const newRefreshToken = generateRefreshToken(user);

  await prisma.$transaction([
    // Revoke old token
    prisma.refreshToken.update({
      where: { id: storedToken.id },
      data:  { is_revoked: true },
    }),
    // Save new hashed refresh token
    prisma.refreshToken.create({
      data: {
        user_id:     user.user_id,
        token:       hashToken(newRefreshToken),   // ← hash the JWT itself
        device_info: req.headers["user-agent"]               || null,
        ip_address:  req.ip || req.headers["x-forwarded-for"] || null,
        expires_at:  new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      },
    }),
  ]);

  await logAuthEvent(user.user_id, "TOKEN_REFRESHED", req);

  // ── 6. Return new tokens ──
  return res
    .status(200)
    .cookie("accessToken", newAccessToken, options)
    .cookie("refreshToken", newRefreshToken, options)
    .json(
      new ApiResponse(200, {
        accessToken:  newAccessToken,
        refreshToken: newRefreshToken,
      }, "Access token refreshed successfully")
    );
});


// ─────────────────────────────────────────────
// REGISTER
// ─────────────────────────────────────────────
const registerUser = asyncHandler(async (req, res) => {
  
  // ── 1. Destructure body ──
  const email = normalizeEmail(req.body.email);
  const password = req.body.password || "";
  const first_name = normalizeName(req.body.first_name);
  const last_name = normalizeName(req.body.last_name);

  // ── 2. Validate fields ──
  if (!email || !password || !first_name || !last_name) {
    throw new ApiError(400, "All fields are required");
  }

  if (!emailRegex.test(email)) {
    throw new ApiError(400, "Invalid email format");
  }

  if (first_name.length > 50 || last_name.length > 50) {
    throw new ApiError(400, "First and last name must be 50 characters or fewer");
  }

  if (!nameRegex.test(first_name) || !nameRegex.test(last_name)) {
    throw new ApiError(400, "Names can contain letters, apostrophes, hyphens, and spaces only");
  }

  if (/\s/.test(password) || !passwordRegex.test(password)) {
    throw new ApiError(
      400,
      "Password must be at least 8 characters and include uppercase, lowercase, number, and symbol"
    );
  }

  // ── 3. Check if email already exists ──
  const emailExists = await prisma.user.findUnique({ where: { email } });

  if (emailExists?.is_verified) {
    throw new ApiError(400, "Email already registered");
  }

  if (emailExists && !emailExists.is_verified) {
    await prisma.emailVerificationToken.deleteMany({ 
      where: { user_id: emailExists.user_id } 
    });
    await prisma.user.delete({ 
      where: { user_id: emailExists.user_id } 
    });
  }

  // ── 4. Hash password ──
  const password_hash = await bcrypt.hash(password, 12);

  // ── 5. Create user ──
  const user = await prisma.user.create({
    data: {
      email,
      password_hash,   // ✅ matches DB field name exactly
      first_name,
      last_name,
    },
  });

  // ── 6. Generate OTP ──
  const rawOTP    = generateOTP();
  const hashedOTP = hashToken(rawOTP);
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await prisma.emailVerificationToken.create({
    data: { 
      user_id:    user.user_id, 
      token:      hashedOTP, 
      expires_at: expiresAt 
    },
  });

  // ── 7. Send OTP email ──
  await sendOTPEmail(email, rawOTP, first_name);
  await logAuthEvent(user.user_id, "REGISTER", req);

  // ── 8. Return response ──
  return res.status(201).json(
    new ApiResponse(201, { email }, "Please verify your email with the OTP sent.")
  );
});
// ─────────────────────────────────────────────
// VERIFY OTP
// ─────────────────────────────────────────────
const verifyOTP = asyncHandler(async (req, res) => {
  const email = normalizeEmail(req.body.email);
  const otp = String(req.body.otp || "").trim();

  if (!email || !otp) throw new ApiError(400, "email and otp are required");
  if (!emailRegex.test(email)) throw new ApiError(400, "Invalid email format");
  if (!otpRegex.test(otp)) throw new ApiError(400, "OTP must be exactly 6 digits");

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new ApiError(404, "No account found with that email");
  if (user.is_verified) throw new ApiError(400, "Account already verified. Please login.");

  const hashedInput = hashToken(otp);
  const tokenRecord = await prisma.emailVerificationToken.findFirst({
    where:   { user_id: user.user_id, token: hashedInput },
    orderBy: { created_at: "desc" },
  });

  if (!tokenRecord || tokenRecord.used_at) throw new ApiError(400, "Invalid OTP");
  if (tokenRecord.expires_at < new Date()) throw new ApiError(400, "OTP expired. Request a new one.");

  const { updatedUser } = await prisma.$transaction(async (tx) => {
    await tx.emailVerificationToken.update({
      where: { token_id: tokenRecord.token_id },
      data:  { used_at: new Date() },
    });

    const updatedUser = await tx.user.update({
      where: { email },
      data:  { is_verified: true },
    });

    const hashedRefresh = hashToken(crypto.randomBytes(64).toString("hex"));
    await tx.refreshToken.create({
      data: {
        user_id:    updatedUser.user_id,
        token:      hashedRefresh,
        expires_at: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      },
    });

    return { updatedUser };
  });

  await logAuthEvent(updatedUser.user_id, "OTP_VERIFIED", req);

  const accessToken  = generateAccessToken(updatedUser);
  const refreshToken = generateRefreshToken(updatedUser);

  return res
    .status(200)
    .cookie("accessToken",  accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(new ApiResponse(200, {
      accessToken,
      refreshToken,
      user: {
        user_id:     updatedUser.user_id,
        email:       updatedUser.email,
        first_name:  updatedUser.first_name,
        last_name:   updatedUser.last_name,
        is_verified: updatedUser.is_verified,
      },
    }, "Email verified! Account is now active."));
});

// ─────────────────────────────────────────────
// RESEND OTP
// ─────────────────────────────────────────────
const resendOTP = asyncHandler(async (req, res) => {
  const email = normalizeEmail(req.body.email);

  if (!email) throw new ApiError(400, "email is required");
  if (!emailRegex.test(email)) throw new ApiError(400, "Invalid email format");

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new ApiError(404, "No account found with that email");
  if (user.is_verified) throw new ApiError(400, "Account already verified. Please login.");

  await prisma.emailVerificationToken.deleteMany({ where: { user_id: user.user_id } });

  const rawOTP    = generateOTP();
  const hashedOTP = hashToken(rawOTP);
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await prisma.emailVerificationToken.create({
    data: { user_id: user.user_id, token: hashedOTP, expires_at: expiresAt },
  });

  await sendOTPEmail(email, rawOTP, user.first_name || user.username);

  return res.status(200).json(new ApiResponse(200, { email }, "New OTP sent to your email"));
});

// ─────────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────────
/**
 * POST /api/v1/users/login
 *
 * Body: { identifier, password }
 * identifier = email OR username
 *
 * Flow:
 *   1. Validate input
 *   2. Find user by email or username
 *   3. Check is_verified + is_active + is_deleted
 *   4. Compare password with bcrypt
 *   5. Generate access + refresh JWT tokens
 *   6. Save hashed refresh token to RefreshTokens table
 *   7. Log to AuthenticationLog
 *   8. Set httpOnly cookies + return tokens in body
 */
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // ── 1. Validate ──
  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  // ── 2. Find user by email ──
  const user = await prisma.user.findFirst({
    where: { email: email },
  });

  if (!user) {
    throw new ApiError(404, "No account found with that email");
  }

  // ── 3. Check account status ──
  if (!user.is_verified) {
    throw new ApiError(403, "Email not verified. Please verify your account first.");
  }

  if (!user.is_active) {
    throw new ApiError(403, "Account is deactivated. Please contact support.");
  }

  if (user.is_deleted) {
    throw new ApiError(403, "Account not found.");
  }

  // ── 4. Compare password ──
  const isPasswordValid = await bcrypt.compare(password, user.password_hash);

  if (!isPasswordValid) {
    await logAuthEvent(user.user_id, "LOGIN_FAILED", req, "failed");
    throw new ApiError(401, "Incorrect password");
  }

  // ── 5. Generate JWT tokens ──
  const accessToken  = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // ── 6. Save hashed refresh token to DB ──
  await prisma.refreshToken.create({
    data: {
      user_id:     user.user_id,
      token:       hashToken(refreshToken),
      device_info: req.headers["user-agent"]                || null,
      ip_address:  req.ip || req.headers["x-forwarded-for"] || null,
      expires_at:  new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    },
  });

  // ── 7. Log successful login ──
  await logAuthEvent(user.user_id, "LOGIN", req, "success");

  // ── 8. Return response ──
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(200, {
        accessToken,
        refreshToken,
        user: {
          user_id:             user.user_id,
          email:               user.email,       // ✅ username removed
          first_name:          user.first_name,
          last_name:           user.last_name,
          profile_picture_url: user.profile_picture_url,
          is_verified:         user.is_verified,
        },
      }, "Logged in successfully")
    );
});

// --------------------------------------------
// Logout Controller
// --------------------------------------------
const logoutUser = asyncHandler(async (req, res) => {
  const userId = req.user.user_id;

  await prisma.refreshToken.updateMany({
    where: {
      user_id:    userId,
      is_revoked: false,
    },
    data: { is_revoked: true },
  });

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});


// --------------------------------------------
// changePassword
// --------------------------------------------
const changePassword = asyncHandler(async (req, res) => {
  const userId = req.user?.user_id;

  if (!userId) {
    throw new ApiError(401, "Unauthorized User");
  }

  const { currentPassword, newPassword, confirmPassword } = req.body;

  if (!currentPassword || !newPassword || !confirmPassword) {
    throw new ApiError(400, "Current, new, and confirm password are required");
  }

  if (newPassword !== confirmPassword) {
    throw new ApiError(400, "New and confirm password must be same");
  }

  if (currentPassword === newPassword) {
    throw new ApiError(400, "New password must be different from current password");
  }

  const user = await prisma.user.findUnique({
    where: { user_id: userId },
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const isMatch = await bcrypt.compare(currentPassword, user.password_hash);

  if (!isMatch) {
    throw new ApiError(400, "Current password is incorrect");
  }

  const newHashedPassword = await bcrypt.hash(newPassword, 12);

  await prisma.user.update({
    where: { user_id: userId },
    data: { password_hash: newHashedPassword },
  });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password Changed Successfully."));
});

// ─────────────────────────────────────────────
// [1] FORGOT PASSWORD — Send OTP to email
// ─────────────────────────────────────────────
// POST => /api/v1/users/forgot-password

const forgotPassword = asyncHandler(async (req, res) => {

  // ── 1. Get email from body ──
  const { email } = req.body;

  if (!email) {
    throw new ApiError(400, "Email is required");
  }

  // ── 2. Check if user exists ──
  const user = await prisma.user.findUnique({
    where: { email },
  });

  // ── 3. Always return same response (security best practice)
  //       Don't reveal if email exists or not
  if (!user) {
    return res.status(200).json(
      new ApiResponse(200, {}, "If this email exists, an OTP has been sent.")
    );
  }

  // ── 4. Check account status ──
  if (!user.is_verified) {
    throw new ApiError(403, "Account not verified. Please verify your email first.");
  }

  if (!user.is_active) {
    throw new ApiError(403, "Account is deactivated. Please contact support.");
  }

  // ── 5. Delete any existing reset tokens for this user ──
  await prisma.passwordResetToken.deleteMany({
    where: { user_id: user.user_id },
  });

  // ── 6. Generate OTP ──
  const rawOTP    = generateOTP();
  const hashedOTP = hashToken(rawOTP);
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  // ── 7. Save hashed OTP to DB ──
  await prisma.passwordResetToken.create({
    data: {
      user_id:    user.user_id,
      token:      hashedOTP,
      expires_at: expiresAt,
    },
  });

  // ── 8. Send OTP email ──
  await sendOTPEmail(email, rawOTP, user.first_name);

  // ── 9. Log event ──
  await logAuthEvent(user.user_id, "FORGOT_PASSWORD_OTP_SENT", req, "success");

  return res.status(200).json(
    new ApiResponse(200, { email }, "OTP sent to your email. Valid for 15 minutes.")
  );
});


// ─────────────────────────────────────────────
// [2] VERIFY FORGOT PASSWORD OTP
// ─────────────────────────────────────────────
// POST => /api/v1/users/verify-forgot-password-otp

const verifyForgotPasswordOTP = asyncHandler(async (req, res) => {

  // ── 1. Get email and OTP from body ──
  const { email, otp } = req.body;

  if (!email || !otp) {
    throw new ApiError(400, "Email and OTP are required");
  }

  // ── 2. Find user ──
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // ── 3. Find the reset token in DB ──
  const hashedOTP = hashToken(otp);

  const resetToken = await prisma.passwordResetToken.findFirst({
    where: {
      user_id: user.user_id,
      token:   hashedOTP,
    },
  });

  // ── 4. Validate token ──
  if (!resetToken) {
    throw new ApiError(400, "Invalid OTP");
  }

  if (resetToken.expires_at < new Date()) {
    // Delete expired token
    await prisma.passwordResetToken.delete({
      where: { token_id: resetToken.token_id },
    });
    throw new ApiError(400, "OTP has expired. Please request a new one.");
  }

  // ── 5. Generate a short-lived resetToken to allow password change ──
  //       This proves the user verified OTP without keeping OTP alive
  const rawResetToken    = crypto.randomBytes(32).toString("hex");
  const hashedResetToken = hashToken(rawResetToken);
  const newExpiresAt     = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // ── 6. Update the token record — mark OTP as verified, store resetToken ──
  await prisma.passwordResetToken.update({
    where: { token_id: resetToken.token_id },
    data: {
      token:       hashedResetToken,  // replace OTP with reset token
      expires_at:  newExpiresAt,
      is_verified: true,
    },
  });

  // ── 7. Log event ──
  await logAuthEvent(user.user_id, "FORGOT_PASSWORD_OTP_VERIFIED", req, "success");

  // ── 8. Return resetToken to frontend (used in next step) ──
  return res.status(200).json(
    new ApiResponse(200, {
      resetToken: rawResetToken,  // frontend stores this temporarily
      email,
    }, "OTP verified. You can now reset your password.")
  );
});

// ─────────────────────────────────────────────
// [3] RESET PASSWORD — Set new password
// ─────────────────────────────────────────────
// POST => /api/v1/users/reset-password

const resetPassword = asyncHandler(async (req, res) => {

  // ── 1. Get data from body ──
  const { email, resetToken, newPassword, confirmPassword } = req.body;

  if (!email || !resetToken || !newPassword || !confirmPassword) {
    throw new ApiError(400, "All fields are required");
  }

  // ── 2. Validate passwords match ──
  if (newPassword !== confirmPassword) {
    throw new ApiError(400, "Passwords do not match");
  }

  if (newPassword.length < 8) {
    throw new ApiError(400, "Password must be at least 8 characters");
  }

  // ── 3. Find user ──
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // ── 4. Find and validate reset token ──
  const hashedResetToken = hashToken(resetToken);

  const storedToken = await prisma.passwordResetToken.findFirst({
    where: {
      user_id:     user.user_id,
      token:       hashedResetToken,
      is_verified: true,              // must have passed OTP step
    },
  });

  if (!storedToken) {
    throw new ApiError(400, "Invalid or expired reset token. Please start over.");
  }

  if (storedToken.expires_at < new Date()) {
    await prisma.passwordResetToken.delete({
      where: { token_id: storedToken.token_id },
    });
    throw new ApiError(400, "Reset token expired. Please request a new OTP.");
  }

  // ── 5. Check new password is not same as old ──
  const isSamePassword = await bcrypt.compare(newPassword, user.password_hash);
  if (isSamePassword) {
    throw new ApiError(400, "New password cannot be the same as your current password");
  }

  // ── 6. Hash new password ──
  const password_hash = await bcrypt.hash(newPassword, 12);

  // ── 7. Update password in DB ──
  await prisma.user.update({
    where: { user_id: user.user_id },
    data:  { password_hash },
  });

  // ── 8. Delete used reset token ──
  await prisma.passwordResetToken.delete({
    where: { token_id: storedToken.token_id },
  });

  // ── 9. Revoke all existing refresh tokens (force re-login) ──
  await prisma.refreshToken.updateMany({
    where: { user_id: user.user_id },
    data:  { is_revoked: true },
  });

  // ── 10. Log event ──
  await logAuthEvent(user.user_id, "PASSWORD_RESET", req, "success");

  return res.status(200).json(
    new ApiResponse(200, {}, "Password reset successfully. Please login with your new password.")
  );
});


// ─────────────────────────────────────────────
// Exports
// ─────────────────────────────────────────────
export {
  registerUser,
  verifyOTP,
  resendOTP,
  loginUser,
  refreshAccessToken,
  logoutUser,
  changePassword,
  forgotPassword,            
  verifyForgotPasswordOTP,  
  resetPassword,             
};
