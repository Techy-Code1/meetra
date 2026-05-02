# meetra
A lightweight, modern video conferencing platform focused on real-time collaboration, simplicity, and human connection.

# Setting up Database Schmena

1. Using Prisma 
    npm i prisma @prisma/client
    npm prisma init

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
    
    3.  For better Understanding Visit:
        - https://console.cloudinary.com/app/c-6e5adde4e5827adfa2e2ad324148b7/image/getting-started

# Setting up Multer middleware for file Uploading 
    Create file on middleware folder named multer.middleware.js 
    - npm i multer
    Help for temp file
    1. Create a method 
        i. storage => for upload the file tempororly
    2. For better Understanding Visit:
        - https://github.com/expressjs/multer 


    






