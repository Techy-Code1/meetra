import { Router } from "express";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { deleteAccount, getProfile, uploadAvatar } from "../controllers/profile.controller.js";
import upload from "../middleware/multer.middleware.js";
const router = Router();

router.route('/upload-avatar').patch(verifyJWT ,  upload.single("profile_picture_url") , uploadAvatar)
router.route('/me').get(verifyJWT , getProfile)
router.route('/delete-account').delete(verifyJWT , deleteAccount)
export default router;