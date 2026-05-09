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

   - Description:
    Returns the currently authenticated user's profile.

   - Response :
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

   - POST /api/v1/users/upload-avatar

   - Description:
    Uploads a profile picture to Cloudinary and updates user record.

   - Response::
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



# Meeting API — Controller Reference

## Overview

This file (`meeting.controller.js`) handles all meeting-related operations for the Meetra application. It uses **Prisma ORM** for database access and follows a consistent pattern of validation → database operation → response.

---

## Helpers

| Helper | Purpose |
|---|---|
| `generateMeetingCode()` | Generates a random 8-character code e.g. `A3FZ9KQ1` |
| `generateMeetingLink(code)` | Builds a joinable URL e.g. `https://yourdomain.com/join/A3FZ9KQ1` |

---

## Endpoints

---

### 1. Create Meeting
**`POST /api/v1/meeting/create-meeting`**

Creates a new meeting and automatically adds the host as the first participant.

**Required fields (body):**
```json
{
  "meeting_title": "Team Sync",
  "scheduled_at": "2026-06-01T10:00:00.000Z"
}
```

**Optional fields:**
```json
{
  "description": "Weekly sync",
  "duration_minutes": 60,
  "max_participants": 10,
  "is_recorded": false
}
```

**Validations:**
- `meeting_title` and `scheduled_at` are required
- `scheduled_at` cannot be in the past

**What it creates in DB:**
- A `meeting` record with status `scheduled`
- A `meetingHost` record linking host to meeting
- A `participant` record for the host with `is_host: true`

**Response:** `201` — full meeting object with host and participant details

---

### 2. Join Meeting
**`POST /api/v1/meeting/join-meeting`**

Allows a user to join an existing meeting via ID, code, or link.

**Body (provide at least one):**
```json
{
  "meeting_id": "abc123",
  "meeting_code": "NOXRGVBT",
  "meeting_link": "https://yourdomain.com/join/NOXRGVBT"
}
```

**Validations:**
- At least one identifier must be provided
- Meeting must not be `ended` or `cancelled`
- Meeting must not exceed `max_participants`

**Smart behaviours:**
- If user already exists as participant → updates `joined_at`, clears `left_at` (rejoin)
- If user is new → creates a fresh participant record
- If meeting was `scheduled` → automatically changes status to `ongoing` and sets `started_at`

**Response:** `200` — meeting info + participant record

---

### 3. End Meeting
**`PATCH /api/v1/meeting/:meeting_id/end`**

Ends an active meeting and stamps `left_at` on all participants who joined.

**Validations (in order):**
1. Meeting must exist → `404`
2. Requester must be the host → `403`
3. Meeting must not already be `ended` → `400`
4. Meeting must not be `scheduled` (must be `ongoing`) → `400`

**What it does atomically (single transaction):**
- Sets meeting `status = "ended"` and `ended_at = now`
- Sets `left_at = now` on all participants where `joined_at IS NOT NULL` and `left_at IS NULL`

> Ghost participants (never joined) are intentionally skipped.

**Response:** `200`
```json
{
  "meeting_id": "abc123",
  "status": "ended",
  "ended_at": "2026-05-09T07:31:13.631Z"
}
```

---

### 4. Get Meeting Details
**`GET /api/v1/meeting/:meeting_id`**

Returns full details of a single meeting including all related data.

**Includes in response:**
- Host profile
- All co-hosts
- All participants with user profiles
- Breakout rooms
- Recordings
- Transcripts
- Invites
- Files
- Non-anonymous feedback
- Count of participants, recordings, messages

**Response:** `200` — complete meeting object

---

### 5. Get Meeting History
**`GET /api/v1/meeting/history`**

Returns a paginated list of meetings created by the logged-in user.

**Query parameters (all optional):**

| Param | Type | Description |
|---|---|---|
| `status` | string | Filter by `scheduled`, `ongoing`, `ended`, `cancelled` |
| `search` | string | Search by meeting title (case-insensitive) |
| `from_date` | date | Meetings scheduled on or after this date |
| `to_date` | date | Meetings scheduled on or before this date |
| `page` | number | Page number (default: `1`) |
| `limit` | number | Results per page (default: `10`, max: `100`) |

**Example URL:**
```
GET /api/v1/meeting/history?status=ended&search=team&from_date=2026-01-01&page=1&limit=5
```

**Response:** `200`
```json
{
  "meetings": [...],
  "meta": {
    "total": 47,
    "page": 1,
    "limit": 5,
    "totalPages": 10
  }
}
```

---

### 6. Update Meeting
**`PATCH /api/v1/meeting/:meeting_id`**

Updates meeting details. Only provided fields are updated (partial update).

**Updatable fields (body):**
```json
{
  "meeting_title": "Updated Title",
  "description": "New description",
  "scheduled_at": "2026-07-01T10:00:00.000Z",
  "duration_minutes": 90,
  "max_participants": 20,
  "is_recorded": true,
  "status": "ongoing"
}
```

**Validations:**
- Requester must be the host → `403`
- Meeting must not be `ended` → `400`

**Response:** `200` — updated meeting object

---

### 7. Cancel Meeting
**`PATCH /api/v1/meeting/:meeting_id/cancel`**

Cancels a meeting that hasn't ended yet.

**Validations:**
- Requester must be the host → `403`
- Meeting must not already be `ended` or `cancelled` → `400`

**Response:** `200`
```json
{
  "meeting_id": "abc123",
  "status": "cancelled"
}
```

---

### 8. Delete Meeting
**`DELETE /api/v1/meeting/:meeting_id`**

Permanently deletes a meeting and all its related data.

**Validations:**
- Requester must be the host → `403`
- Meeting must not be `ongoing` (end it first) → `400`

**Deletes in order (to respect DB foreign key constraints):**
1. Breakout room participants
2. Breakout rooms
3. Participants
4. Messages
5. Transcripts
6. Invites
7. Recordings
8. Files
9. Feedback
10. Meeting hosts
11. Meeting itself

**Response:** `200` — `{ meeting_id }`

---

### 9. Get Meeting Participants
**`GET /api/v1/meeting/:meeting_id/participants`**

Returns all participants of a meeting with their user profiles.

**Response:** `200`
```json
{
  "participants": [...],
  "total": 8
}
```

---

## Meeting Status Flow

```
scheduled ──(first user joins)──► ongoing ──(host ends)──► ended
    │
    └──(host cancels)──► cancelled
```

---

## Common Error Codes

| Code | Meaning |
|---|---|
| `400` | Bad request — validation failed |
| `403` | Forbidden — not the host |
| `404` | Meeting not found |

---

## Auth

All endpoints require a valid **JWT token** in the Authorization header:
```
Authorization: Bearer <your_token>
```
The user identity (`user_id`) is extracted from the token — never from the request body.


