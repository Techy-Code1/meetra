import { Router } from "express";
import {
     registerUser ,  
     verifyOTP,
    resendOTP, 
    loginUser ,
    refreshAccessToken ,
    logoutUser, 
    getCurrentUser, 
    uploadAvatar ,

} from "../controllers/user.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import upload from "../middleware/multer.middleware.js"
const router =  Router()

router.route('/register').post(registerUser)
router.route('/verify-otp').post(verifyOTP);
router.route('/resend-otp').post(resendOTP);
router.route('/login').post(loginUser)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/logout").post(verifyJWT , logoutUser)
router.route('/me').get(verifyJWT , getCurrentUser)
router.route('/upload-avatar').post(verifyJWT ,  upload.single("profile_picture_url") , uploadAvatar)

export default router;