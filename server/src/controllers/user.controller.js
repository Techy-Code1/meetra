import { ApiError } from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from '../utils/asyncHandler.js'
import { generateAccessToken, generateRefreshToken } from "../utils/jwt.js";
import bcrypt from 'bcrypt'
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken"; 
import prisma from "../db/index.js";   

const registerUser = asyncHandler(async(req , res) => {
     // return response
    return res.status(201).json( new ApiResponse(200 , {} , "User registered Successfully."))
})

export {
  registerUser 
}