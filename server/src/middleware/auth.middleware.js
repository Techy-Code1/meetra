// auth.middleware.js
import jwt from "jsonwebtoken";
import prisma from "../db/index.js";
import { ApiError } from "../utils/ApiError.js";

export const verifyJWT = async (req, res, next) => {
  try {
    // ── 1. Extract token from cookie or Authorization header ──
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return next(new ApiError(401, "Unauthorized — no token provided"));
    }

    // ── 2. Verify signature ──
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    } catch (err) {
      return next(new ApiError(401, "Invalid or expired access token"));
    }

    // ── 3. Fetch user ──
    const user = await prisma.user.findUnique({
      where: { user_id: decoded.user_id },
      select: {
        user_id:     true,
        username:    true,
        email:       true,
        is_active:   true,
        is_verified: true,
      },
    });

    if (!user) {
      return next(new ApiError(401, "User no longer exists"));
    }

    if (!user.is_active || !user.is_verified) {
      return next(new ApiError(403, "Account is inactive or unverified"));
    }

    // ── 4. Attach to request ──
    req.user = user;
    next();
  } catch (error) {
    return next(new ApiError(500, error?.message || "Authentication failed"));
  }
};