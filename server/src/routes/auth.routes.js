import { Router } from "express";
import {
    registerUser ,  
    verifyOTP ,
    resendOTP , 
    loginUser ,
    refreshAccessToken ,
    logoutUser, 
    changePassword ,
    forgotPassword ,
    verifyForgotPasswordOTP,
    resetPassword,

} from "../controllers/auth.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
const router =  Router()

router.route('/register').post(registerUser)
router.route('/verify-otp').post(verifyOTP);
router.route('/resend-otp').post(resendOTP);
router.route('/login').post(loginUser)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/logout").post(verifyJWT , logoutUser)
router.route('/forgot-password').post(forgotPassword)
router.route('/verify-forgot-password-otp').post(verifyForgotPasswordOTP)
router.route('/reset-password').post(resetPassword)


router.route('/change-password').patch(verifyJWT , changePassword)

export default router;