import { ApiError }    from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import prisma           from "../db/index.js";
import {uploadToCloudinary , deleteFromCloudinary} from '../utils/cloudinary.js'
import bcrypt from "bcrypt";


// ----------------------------------------------------
// GetCurrentUser OR get Profile
// ----------------------------------------------------
const getProfile = asyncHandler(async (req, res) => {
  try {
    const userId = req.user?.user_id;

    if (!userId) {
      throw new ApiError(400, "UnAuthorized");
    }

    const user = await prisma.user.findUnique({
      where: { user_id: userId },
      select: {
        user_id:             true,
        email:               true,
        first_name:          true,
        last_name:           true,
        profile_picture_url: true,
        created_at:          true,
        is_active:           true,
        is_verified:         true,
      },
    });

    if (!user) {
      throw new ApiError(404, "User not Found");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, user, "Current User Retrieved Successfully."));

  } catch (error) {
    console.error("GET /me error:", error);
    return res
      .status(500)
      .json(new ApiResponse(500, {}, "Internal Server Error"));
  }
});

// --------------------------------------------
// uploadAvatar
// --------------------------------------------
const uploadAvatar = asyncHandler(async (req, res) => {
  try {
    if (!req.file) {
      throw new ApiError(400, "No Files Uploaded");
    }

    const userId = req.user?.user_id;

    if (!userId) {
      throw new ApiError(401, "UnAuthorized");
    }

    // Upload to Cloudinary
    const uploadResult = await uploadToCloudinary(req.file.path, "profile_picture_url");

    // Update user in DB
    const updatedUser = await prisma.user.update({
      where: { user_id: userId },
      data: {
        profile_picture_url: uploadResult.secure_url,
      },
    });

    return res
      .status(200)
      .json(new ApiResponse(200, updatedUser.profile_picture_url, "Avatar Uploaded Successfully."));

  } catch (error) {
    console.error("Upload Avatar Error:", error);
    return res
      .status(500)                                      
      .json(new ApiResponse(500, {}, "Internal Server Error"));
  }
});

const deleteAccount = asyncHandler(async (req, res) => {
  const userId = req.user.user_id;
  const { password } = req.body;

  // 1. Require password confirmation
  if (!password) {
    throw new ApiError(400, "Password is required.");
  }

  // 2. Fetch user
  const user = await prisma.user.findUnique({
    where: { 
      user_id: userId,
      is_deleted: false,  // prevent double deletion
    },
  });

  if (!user) {
    throw new ApiError(404, "User not found.");
  }

  // 3. Verify password
  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    throw new ApiError(401, "Incorrect password.");
  }

  // 4. Soft delete in a transaction
  await prisma.$transaction([

    // Anonymize & mark deleted
    prisma.user.update({
      where: { user_id: userId },
      data: {
        is_deleted:          true,
        is_active:           false,
        deleted_at:          new Date(),
        email:               `deleted_${userId}@deleted.com`,
        first_name:          "Deleted",
        last_name:           "User",
        profile_picture_url: null,
        password_hash:       "DELETED",  // prevent any future login
      },
    }),

    // Revoke all refresh tokens
    prisma.refreshToken.updateMany({
      where: { user_id: userId },
      data:  { is_revoked: true },
    }),

    // Log the deletion
    prisma.auditLog.create({
      data: {
        user_id:     userId,
        action:      "ACCOUNT_DELETED",
        entity_type: "User",
        entity_id:   userId,
        details:     "User self-deleted their account.",
      },
    }),

  ]);

  // 5. Clear auth cookie
  res.clearCookie("token");

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Account deleted successfully."));
});


export {
    getProfile ,
    uploadAvatar ,
    deleteAccount ,
}