# meetra
A lightweight, modern video conferencing platform focused on real-time collaboration, simplicity, and human connection.

# Setting up Database Schmena

1. Using Prisma 
    npm i prisma @prisma/client
    npx prisma init --datasource-provider postgresql

2. Add Prisma Script on package.json on scripts :
    "db:migrate": "prisma migrate dev",
    "db:studio": "prisma studio",
    "db:generate": "prisma generate" 

3.  Set Up Environment Variables:
    DATABASE_URL="postgresql://user:pass@ep-xxx.neon.tech/dbname?sslmode=require&pgbouncer=true"
    DIRECT_URL="postgresql://user:pass@ep-xxx.neon.tech/dbname?sslmode=require"
    
Note :: Neon Dashboard → Connection Details → copy Pooled connection for DATABASE_URL and Direct connection for DIRECT_URL

4. Create Prisma Schema for related Tables: 
    User
    Meeting
    etc

5. Run the Migration
    It helps to load the table on Neon (Remote Hoisting the DB)
    npx prisma migrate dev --name init

6. Resouces:
   - https://neon.com/
   - https://www.prisma.io/docs

7. DB Design Resources:
   - https://databasesample.com/sandbox/zoom-database

# Setting up Custom Class For ErrorHandler , ApiError and ApiResponse Files
    Utils
      ApiError.js
      ApiResponse.js
      AsyncHandler.js

# Setting Up JWT

    1. Install required Dependencies Packages:
        npm i jsonwebtoken bcrypt
    2. Create file jwt.js on utils folder
        Utils
            jwt.js
                Create two method 
                i. generateAccessToken
                ii. generateRefreshToken
        controlllers
            user.controllers.js
                Create required methods like:
                i. RegisterUser
                ii. LoginUser
                .... etc
    3. For better Understanding Visit:
        - https://www.jwt.io/


#   Setting Up Cloudinary and multer from Image , Video Storage
    1. install required packages
        npm i cloudinary
    2. Create file on utils folder named cloudinary.js 
        utils
        - cloudinary.js

        1. Configure Cloudinary
        2. Create reqired method for cloudinary
            i.  uploadCloudinary
            ii. deleteFromCloudinary
    
    For better Understanding Visit:
        - https://console.cloudinary.com/app/c-6e5adde4e5827adfa2e2ad324148b7/image/getting-started

# Setting up Multer middleware for file Uploading 
    Create file on middleware folder named multer.middleware.js 
    - npm i multer
    Help for temp file
    1. Create a method 
        i. storage => for upload the file tempororly

    For better Understanding Visit:
        - https://github.com/expressjs/multer 

# Creating Method for Controllers:
    * POST http://localhost:8000/api/v1/users/login

    1. registerUser logic Building Steps
        i.  get user details from frontend
        ii. validation - not empty
        iii. check if user already exists
        iv. check for images , check for profile_pic
        v. if avaliable upload them to cloudinary
        vi. create user - create entry in DB
        vii. remove password and refresh token
        viii. check for user creation
        ix. return response to frontend.
    
    2. LoginUser Controllers Flow 
    * POST http://localhost:8000/api/v1/users/login
 
    * Body: { identifier, password }
    * identifier = email OR username
    
    * Flow:
     1. Validate input
     2. Find user by email or username
     3. Check is_verified + is_active + is_deleted
     4. Compare password with bcrypt
     5. Generate access + refresh JWT tokens
     6. Save hashed refresh token to RefreshTokens table
     7. Log to AuthenticationLog
     8. Set httpOnly cookies + return tokens in body

# Adding User Authentication and Profile Management API
This module provides secure user account management features including profile retrieval, avatar upload, password management, and OTP-based password recovery.

Features :
1. Get current authenticated user
    GET /api/v1/users/me

    Description:
    Returns the currently authenticated user's profile.

    Response :
    ``` {
  "status": 200,
  "data": {
    "user_id": "...",
    "email": "...",
    "first_name": "...",
    "last_name": "...",
    "profile_picture_url": "...",
    "created_at": "...",
    "is_active": true,
    "is_verified": true
    }
  }```

2. Upload profile avatar (Cloudinary)

    POST /api/v1/users/upload-avatar

    Description:
    Uploads a profile picture to Cloudinary and updates user record.

    Response::
    {  
        "status": 200,
        "data": "https://cloudinary-url"
    }


3. Change password (authenticated)
   - POST /api/v1/users/change-password
   - in postman got to Body and paste it ::
    {
    "currentPassword": "old_pass",
    "newPassword": "new_pass",
    "confirmPassword": "new_pass"
    }
   - Validations:
    All fields required
    New password must differ from old
    Password confirmation must match

4. Forgot password (OTP via email)
    - POST /api/v1/users/forgot-password

    - Description:
        Sends OTP to user email (valid for 15 minutes)

     - Body :: 
        {
            "email": "user@example.com"
        }

    Security Behavior:
    - Always returns success (prevents email enumeration)
5. Verify OTP securely
- POST /api/v1/users/verify-forgot-password-otp
- Body :: 
    {
    "email": "user@example.com",
    "otp": "123456"
    }

- Response ::
    {
        "resetToken": "temporary_token"
    }
- Notes:
    OTP is replaced with a short-lived reset token
    Token valid for 10 minutes

6. Reset password using token
- POST /api/v1/users/reset-password
- Body :: 
    {
        "email": "user@example.com",
        "resetToken": "token_from_previous_step",
        "newPassword": "new_pass",
        "confirmPassword": "new_pass"
    }
- Actions:
    Validates reset token
    Updates password
    Revokes all refresh tokens
    Deletes reset token

7. Security-first implementation (hashed tokens, silent responses, token expiry)
- Security Design
    Key Practices Implemented:
    - Passwords hashed using bcrypt (salt rounds: 12)
    - OTPs are hashed before storage
    - Token expiration enforced
    -  No user existence leaks (forgot password)
    -  Refresh tokens revoked after password reset
    - Auth events logged (logAuthEvent)


