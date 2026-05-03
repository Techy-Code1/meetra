import { ApiError }    from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import bcrypt           from "bcrypt";
import crypto           from "crypto";
import prisma           from "../db/index.js";
import sendOTPEmail     from "../utils/mailer.js";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt.js";

// Common cookie configuration for authentication tokens
   const options = {
    // httpOnly prevents JavaScript access (XSS protection)
        httpOnly : true ,
    // secure ensures cookies are sent only over HTTPS (production)
        secure : true
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
    where: { user_id: decoded.id },
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
  const { username, email, password, first_name, last_name } = req.body;

  if (!username || !email || !password || !first_name || !last_name) {
    throw new ApiError(400, "All fields are required");
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) throw new ApiError(400, "Invalid email format");
  if (password.length < 8) throw new ApiError(400, "Password must be at least 8 characters");

  const [emailExists, usernameExists] = await Promise.all([
    prisma.user.findUnique({ where: { email } }),
    prisma.user.findUnique({ where: { username } }),
  ]);

  if (emailExists?.is_verified) throw new ApiError(400, "Email already registered");
  if (usernameExists?.is_verified && usernameExists.user_id !== emailExists?.user_id)
    throw new ApiError(400, "Username already taken");

  if (emailExists && !emailExists.is_verified) {
    await prisma.emailVerificationToken.deleteMany({ where: { user_id: emailExists.user_id } });
    await prisma.user.delete({ where: { user_id: emailExists.user_id } });
  }

  const password_hash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { username, email, password_hash, first_name, last_name },
  });

  const rawOTP    = generateOTP();
  const hashedOTP = hashToken(rawOTP);
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await prisma.emailVerificationToken.create({
    data: { user_id: user.user_id, token: hashedOTP, expires_at: expiresAt },
  });

  await sendOTPEmail(email, rawOTP, first_name);
  await logAuthEvent(user.user_id, "REGISTER", req);

  return res.status(201).json(
    new ApiResponse(201, { email }, "Account created. Please verify your email with the OTP sent.")
  );
});

// ─────────────────────────────────────────────
// VERIFY OTP
// ─────────────────────────────────────────────
const verifyOTP = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) throw new ApiError(400, "email and otp are required");

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
        username:    updatedUser.username,
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
  const { email } = req.body;

  if (!email) throw new ApiError(400, "email is required");

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
  const { email , username , password } = req.body;
  console.log(email)
  console.log(username)

  // ── 1. Validate ──
  if (!(email || username) || !password) {
    throw new ApiError(400, "Email or username and password are required");
  }

  // ── 2. Find user by email or username ──
  const isEmail = email.includes("@");

  const user = await prisma.user.findFirst({
    where: isEmail
      ? { email:    email }
      : { username: username },
  });

  if (!user) {
    throw new ApiError(404, "No account found with that email or username");
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
  // Hash the JWT itself so refreshAccessToken can verify it later.
  // Previously a separate rawRefresh was hashed — that made the stored
  // token impossible to match against the cookie/body value on refresh.
  await prisma.refreshToken.create({
    data: {
      user_id:     user.user_id,
      token:       hashToken(refreshToken),          
      device_info: req.headers["user-agent"]               || null,
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
          username:            user.username,
          email:               user.email,
          first_name:          user.first_name,
          last_name:           user.last_name,
          profile_picture_url: user.profile_picture_url,
          is_verified:         user.is_verified,
        },
      }, "Logged in successfully")
    );
});

// ─────────────────────────────────────────────
// Exports the Controllers
// ---------------------------------------------
export {
    registerUser, 
    verifyOTP,
    resendOTP, 
    loginUser ,
    refreshAccessToken ,

  }