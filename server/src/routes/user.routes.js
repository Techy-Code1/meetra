import { Router } from "express";
import {
     registerUser ,  
     verifyOTP,
    resendOTP, 
    loginUser ,
    refreshAccessToken
} from "../controllers/user.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
const router =  Router()

router.route('/register').post(registerUser)
router.route('/verify-otp').post(verifyOTP);
router.route('/resend-otp').post(resendOTP);
router.route('/login').post(verifyJWT , loginUser)
router.route("/refresh-token").post(refreshAccessToken)

export default router;