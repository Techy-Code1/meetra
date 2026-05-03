// auth.middleware.js
import jwt        from "jsonwebtoken";
import prisma     from "../db/index.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const verifyJWT = asyncHandler(async (req, res, next) => {
  // ── 1. Extract token from cookie or Authorization header ──
  const token =
    req.cookies?.accessToken ||
    req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    throw new ApiError(401, "Unauthorized — no token provided");
  }

  // ── 2. Verify signature ──
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
  } catch (err) {
    throw new ApiError(401, "Invalid or expired access token");
  }

  // ── 3. Fetch user — decoded.id maps to user_id ──
  const user = await prisma.user.findUnique({
    where: { user_id: decoded.id },   // ← decoded.id, not decoded.user_id
    select: {
      user_id:     true,
      username:    true,
      email:       true,
      is_active:   true,
      is_verified: true,
    },
  });

  if (!user) {
    throw new ApiError(401, "User no longer exists");
  }

  if (!user.is_active || !user.is_verified) {
    throw new ApiError(403, "Account is inactive or unverified");
  }

  // ── 4. Attach to request ──
  req.user = user;
  next();
});