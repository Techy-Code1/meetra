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

# Meetra — Meeting API Documentation

**Base URL:** `http://localhost:8000/api/v1/meeting`  
**Auth:** All endpoints require `Authorization: Bearer <JWT_TOKEN>` header  
**Content-Type:** `application/json`

---

## Table of Contents

1. [Create Instant Meeting](#1-create-instant-meeting)
2. [Schedule Meeting](#2-schedule-meeting)
3. [Join Meeting](#3-join-meeting)
4. [Get Meeting History](#4-get-meeting-history)
5. [Get Upcoming Meetings](#5-get-upcoming-meetings)
6. [Get Meeting Details](#6-get-meeting-details)
7. [Add Co-Host](#7-add-co-host)
8. [Generate Invite Link](#8-generate-invite-link)
9. [Send Email Invite](#9-send-email-invite)
10. [Get Meeting Participants](#10-get-meeting-participants)
11. [Remove Participant](#11-remove-participant)
12. [Update Meeting](#12-update-meeting)
13. [Cancel Meeting](#13-cancel-meeting)
14. [End Meeting](#14-end-meeting)
15. [Delete Meeting](#15-delete-meeting)
16. [Update Schedule](#16-update-schedule)
17. [Sync Calendar Invite](#17-sync-calendar-invite)

---

## Meeting Status Flow

```
scheduled ──(first join)──► ongoing ──(host ends)──► ended
    │
    └──(host cancels)──► cancelled
```

---

## 1. Create Instant Meeting

Creates a meeting immediately — no form required. Meeting starts right away like Google Meet.

**Route:** `POST /create-meeting`

**Auth:** Required (host)

**Body:** All fields optional

```json
{
  "meeting_title":   "Quick Sync",
  "description":     "Optional description",
  "max_participants": 10,
  "is_recorded":     false
}
```

**Success Response `201`:**

```json
{
  "statusCode": 201,
  "data": {
    "meeting_id":    "cm...",
    "meeting_code":  "A3FZ9KQ1",
    "meeting_link":  "http://localhost:3000/join/A3FZ9KQ1",
    "meeting_title": "Meeting May 9, 02:30 PM",
    "status":        "ongoing",
    "started_at":    "2026-05-09T10:00:00.000Z",
    "host": {
      "user_id":             "cm...",
      "first_name":          "Raja",
      "last_name":           "Mikrani",
      "profile_picture_url": "https://..."
    }
  },
  "message": "Meeting created — share the link to invite others"
}
```

**Error Responses:**

| Code | Message |
|---|---|
| `401` | Unauthorized — missing or invalid token |

**Postman:**
```
POST http://localhost:8000/api/v1/meeting/create-meeting
Authorization: Bearer <token>
Body: {} ← empty body works
```

---

## 2. Schedule Meeting

Creates a future meeting with a specific date and time.

**Route:** `POST /schedule`

**Auth:** Required (host)

**Body:**

```json
{
  "meeting_title":    "Team Weekly Sync",
  "scheduled_at":     "2026-06-01T10:00:00.000Z",
  "description":      "Weekly project sync",
  "duration_minutes": 60,
  "max_participants": 10,
  "is_recorded":      true,
  "invite_emails":    ["john@gmail.com", "sara@gmail.com"]
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `meeting_title` | string | ✅ | Cannot be empty |
| `scheduled_at` | ISO date | ✅ | Must be in the future |
| `description` | string | ❌ | |
| `duration_minutes` | number | ❌ | Default: 60 |
| `max_participants` | number | ❌ | Default: null (unlimited) |
| `is_recorded` | boolean | ❌ | Default: false |
| `invite_emails` | string[] | ❌ | Pre-creates invite records |

**Success Response `201`:**

```json
{
  "statusCode": 201,
  "data": {
    "meeting_id":       "cm...",
    "meeting_title":    "Team Weekly Sync",
    "meeting_code":     "B7KQ2NXT",
    "meeting_link":     "http://localhost:3000/join/B7KQ2NXT",
    "status":           "scheduled",
    "scheduled_at":     "2026-06-01T10:00:00.000Z",
    "started_at":       null,
    "duration_minutes": 60,
    "is_recorded":      true,
    "meetingInvites":   [...],
    "participants": [
      { "user_id": "cm...", "is_host": true, "joined_at": null }
    ]
  },
  "message": "Meeting scheduled successfully"
}
```

**Error Responses:**

| Code | Message |
|---|---|
| `400` | meeting_title is required |
| `400` | scheduled_at is required |
| `400` | scheduled_at is not a valid date |
| `400` | scheduled_at cannot be in the past |
| `401` | Unauthorized |

**Postman:**
```
POST http://localhost:8000/api/v1/meeting/schedule
Authorization: Bearer <token>
Body: { "meeting_title": "Sync", "scheduled_at": "2026-06-01T10:00:00.000Z" }
```

---

## 3. Join Meeting

Join an existing meeting using meeting ID, code, or link.

**Route:** `POST /join-meeting`

**Auth:** Required

**Body:** Provide at least one identifier

```json
{
  "meeting_id":   "cm...",
  "meeting_code": "A3FZ9KQ1",
  "meeting_link": "http://localhost:3000/join/A3FZ9KQ1"
}
```

**Smart behaviours:**
- If meeting is `scheduled` → auto-transitions to `ongoing`, sets `started_at`
- If user already joined before → updates `joined_at`, clears `left_at` (rejoin)
- If user is new → creates participant record

**Success Response `200`:**

```json
{
  "statusCode": 200,
  "data": {
    "meeting_id":    "cm...",
    "meeting_code":  "A3FZ9KQ1",
    "meeting_title": "Team Sync",
    "meeting_link":  "http://localhost:3000/join/A3FZ9KQ1",
    "participant": {
      "participant_id": "cm...",
      "user_id":        "cm...",
      "is_host":        false,
      "joined_at":      "2026-05-09T10:05:00.000Z",
      "left_at":        null
    }
  },
  "message": "Joined meeting successfully"
}
```

**Error Responses:**

| Code | Message |
|---|---|
| `400` | Provide meeting_id or meeting_code or meeting_link |
| `400` | Cannot join a meeting that is ended |
| `400` | Cannot join a meeting that is cancelled |
| `400` | Meeting is at full capacity |
| `404` | Meeting not found |

---

## 4. Get Meeting History

Returns paginated list of meetings hosted by the logged-in user.

**Route:** `GET /history`

**Auth:** Required

**Query Parameters:**

| Param | Type | Default | Description |
|---|---|---|---|
| `status` | string | — | Filter: `scheduled`, `ongoing`, `ended`, `cancelled` |
| `search` | string | — | Search by meeting title (case-insensitive) |
| `from_date` | ISO date | — | Meetings on or after this date |
| `to_date` | ISO date | — | Meetings on or before this date |
| `page` | number | `1` | Page number |
| `limit` | number | `10` | Results per page (max: 100) |

**Postman URL:**
```
GET http://localhost:8000/api/v1/meeting/history?status=ended&search=team&page=1&limit=5
Authorization: Bearer <token>
```

**Success Response `200`:**

```json
{
  "statusCode": 200,
  "data": {
    "meetings": [...],
    "meta": {
      "total":      47,
      "page":       1,
      "limit":      5,
      "totalPages": 10
    }
  },
  "message": "Meeting history fetched successfully"
}
```

---

## 5. Get Upcoming Meetings

Returns all scheduled (future) meetings for the logged-in user, sorted by soonest first.

**Route:** `GET /upcoming-meeting`

**Auth:** Required

**Query Parameters:**

| Param | Type | Default | Description |
|---|---|---|---|
| `page` | number | `1` | Page number |
| `limit` | number | `10` | Results per page (max: 100) |
| `from_date` | ISO date | now | Show meetings from this date |
| `to_date` | ISO date | — | Show meetings until this date |

**Postman URL:**
```
GET http://localhost:8000/api/v1/meeting/upcoming-meeting?page=1&limit=10
Authorization: Bearer <token>
```

**Success Response `200`:**

```json
{
  "statusCode": 200,
  "data": {
    "meetings": [
      {
        "meeting_id":    "cm...",
        "meeting_title": "Team Sync",
        "scheduled_at":  "2026-06-01T10:00:00.000Z",
        "starts_in":     "21d 14h",
        "_count": {
          "participants":   3,
          "meetingInvites": 2
        }
      }
    ],
    "meta": { "total": 5, "page": 1, "limit": 10, "totalPages": 1 }
  },
  "message": "Upcoming meetings fetched successfully"
}
```

> `starts_in` is a human-readable field: `"2h 30m"`, `"1d 4h"`, `"Starting now"`

---

## 6. Get Meeting Details

Returns full meeting details including participants, recordings, files, feedback, and more.

**Route:** `GET /:meeting_id`

**Auth:** Required

**Postman:**
```
GET http://localhost:8000/api/v1/meeting/cm...
Authorization: Bearer <token>
```

**Success Response `200`:** Full meeting object including:
- `host` profile
- `meetingHosts` (co-hosts)
- `participants` with user profiles
- `breakoutRooms`
- `recordings`
- `meetingTranscripts`
- `meetingInvites`
- `files`
- `feedback` (non-anonymous only)
- `_count` of participants, recordings, messages

**Error Responses:**

| Code | Message |
|---|---|
| `404` | Meeting not found |

---

## 7. Add Co-Host

Assigns co-host privileges to a user in the meeting.

**Route:** `POST /:meeting_id/add-co-host`

**Auth:** Required (host only)

**Body:**

```json
{
  "user_id": "cm..."
}
```

**Success Response `201`:**

```json
{
  "statusCode": 201,
  "data": {
    "meeting_id": "cm...",
    "co_host": {
      "user_id":    "cm...",
      "first_name": "John",
      "last_name":  "Doe",
      "email":      "john@gmail.com"
    }
  },
  "message": "Co-host added successfully"
}
```

**Error Responses:**

| Code | Message |
|---|---|
| `400` | user_id is required |
| `400` | You are already the host |
| `400` | User is already a co-host |
| `400` | Cannot add co-host to a ended/cancelled meeting |
| `403` | Only the host can assign co-hosts |
| `404` | Meeting not found |
| `404` | User not found |

---

## 8. Generate Invite Link

Creates a shareable invite link with optional expiry. No email required.

**Route:** `POST /:meeting_id/invite-link`

**Auth:** Required (host only)

**Body:**

```json
{
  "expires_in_hours": 48
}
```

| Field | Type | Default | Description |
|---|---|---|---|
| `expires_in_hours` | number | `24` | Link validity duration |

**Success Response `201`:**

```json
{
  "statusCode": 201,
  "data": {
    "invite_id":    "cm...",
    "invite_link":  "http://localhost:3000/join/A3FZ9KQ1?invite=cm...",
    "meeting_code": "A3FZ9KQ1",
    "meeting_link": "http://localhost:3000/join/A3FZ9KQ1",
    "expires_at":   "2026-05-11T10:00:00.000Z",
    "expires_in":   "48 hours"
  },
  "message": "Invite link generated successfully"
}
```

**Error Responses:**

| Code | Message |
|---|---|
| `400` | Cannot generate invite link for a ended/cancelled meeting |
| `403` | Only the host can generate an invite link |
| `404` | Meeting not found |

---

## 9. Send Email Invite

Sends HTML meeting invite emails to one or more recipients.

**Route:** `POST /:meeting_id/invite-email`

**Auth:** Required (host only)

**Body:**

```json
{
  "emails":  ["john@gmail.com", "sara@gmail.com"],
  "message": "Please join on time!"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `emails` | string[] | ✅ | Max 50, must be valid emails |
| `message` | string | ❌ | Personal note from host shown in email |

**Success Response `200`:**

```json
{
  "statusCode": 200,
  "data": {
    "sent_count":   2,
    "failed_count": 0,
    "sent":   ["john@gmail.com", "sara@gmail.com"],
    "failed": []
  },
  "message": "All invites sent successfully"
}
```

**Partial failure response:**
```json
{
  "data": {
    "sent_count":   1,
    "failed_count": 1,
    "sent":   ["john@gmail.com"],
    "failed": ["bad@email"]
  },
  "message": "1 invite(s) sent, 1 failed"
}
```

**Error Responses:**

| Code | Message |
|---|---|
| `400` | Provide at least one email address |
| `400` | Cannot send more than 50 invites at once |
| `400` | Invalid email addresses: bad@, ... |
| `400` | Cannot invite to a ended/cancelled meeting |
| `403` | Only the host can send invites |
| `404` | Meeting not found |

---

## 10. Get Meeting Participants

Returns all participants of a meeting with their user profiles, ordered by join time.

**Route:** `GET /:meeting_id/participants`

**Auth:** Required

**Postman:**
```
GET http://localhost:8000/api/v1/meeting/cm.../participants
Authorization: Bearer <token>
```

**Success Response `200`:**

```json
{
  "statusCode": 200,
  "data": {
    "participants": [
      {
        "participant_id": "cm...",
        "user_id":        "cm...",
        "is_host":        true,
        "is_muted":       false,
        "is_video_on":    true,
        "joined_at":      "2026-05-09T10:00:00.000Z",
        "left_at":        null,
        "user": {
          "first_name":          "Raja",
          "last_name":           "Mikrani",
          "email":               "raja@gmail.com",
          "profile_picture_url": "https://..."
        }
      }
    ],
    "total": 1
  },
  "message": "Participants fetched successfully"
}
```

---

## 11. Remove Participant

Host removes a participant from the meeting. Stamps `left_at` and removes co-host role if applicable.

**Route:** `DELETE /:meeting_id/participants/:user_id/remove`

**Auth:** Required (host only)

**Postman:**
```
DELETE http://localhost:8000/api/v1/meeting/cm.../participants/cm.../remove
Authorization: Bearer <token>
```

**Success Response `200`:**

```json
{
  "statusCode": 200,
  "data": {
    "meeting_id":       "cm...",
    "removed_user_id":  "cm..."
  },
  "message": "Participant removed successfully"
}
```

**Error Responses:**

| Code | Message |
|---|---|
| `400` | Cannot remove participants from an ended meeting |
| `400` | Host cannot remove themselves — end the meeting instead |
| `403` | Only the host can remove participants |
| `404` | Meeting not found |
| `404` | Participant not found in this meeting |

---

## 12. Update Meeting

Updates basic meeting fields. Works on `scheduled` and `ongoing` meetings. Status field is intentionally excluded — use dedicated endpoints for status changes.

**Route:** `PATCH /:meeting_id/update`

**Auth:** Required (host only)

**Body:** All fields optional — only provided fields are updated

```json
{
  "meeting_title":    "Updated Title",
  "description":      "New description",
  "scheduled_at":     "2026-07-01T10:00:00.000Z",
  "duration_minutes": 90,
  "max_participants": 20,
  "is_recorded":      true
}
```

**Success Response `200`:** Updated meeting object

**Error Responses:**

| Code | Message |
|---|---|
| `400` | Cannot update an ended meeting |
| `403` | Only the host can update this meeting |
| `404` | Meeting not found |

---

## 13. Cancel Meeting

Cancels a scheduled meeting and marks all pending invites as declined.

**Route:** `POST /:meeting_id/cancel`

**Auth:** Required (host only)

**Body:**

```json
{
  "reason": "Rescheduling to next week"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `reason` | string | ❌ | Appended to description as `[Cancelled] reason` |

**Success Response `200`:**

```json
{
  "statusCode": 200,
  "data": {
    "meeting_id":   "cm...",
    "status":       "cancelled",
    "reason":       "Rescheduling to next week",
    "cancelled_at": "2026-05-09T10:00:00.000Z"
  },
  "message": "Meeting cancelled successfully"
}
```

**Error Responses:**

| Code | Message |
|---|---|
| `400` | Cannot cancel an ongoing meeting — end it instead |
| `400` | Meeting is already ended/cancelled |
| `403` | Only the host can cancel this meeting |
| `404` | Meeting not found |

---

## 14. End Meeting

Ends an ongoing meeting for all participants. Stamps `left_at` on all active participants simultaneously.

**Route:** `PATCH /:meeting_id/end`

**Auth:** Required (host only)

**Body:** None

**Postman:**
```
PATCH http://localhost:8000/api/v1/meeting/cm.../end
Authorization: Bearer <token>
```

**Success Response `200`:**

```json
{
  "statusCode": 200,
  "data": {
    "meeting_id": "cm...",
    "status":     "ended",
    "ended_at":   "2026-05-09T11:00:00.000Z"
  },
  "message": "Meeting ended for all participants"
}
```

**Error Responses:**

| Code | Message |
|---|---|
| `400` | Meeting already ended |
| `400` | Meeting has not started yet. Start the meeting before ending it |
| `403` | Only the host can end this meeting |
| `404` | Meeting not found |

---

## 15. Delete Meeting

Permanently deletes a meeting and all its related data in the correct FK order.

**Route:** `DELETE /:meeting_id/delete`

**Auth:** Required (host only)

**Postman:**
```
DELETE http://localhost:8000/api/v1/meeting/cm.../delete
Authorization: Bearer <token>
```

**Deletes in order:**
`breakoutRoomParticipants` → `breakoutRooms` → `participants` → `messages` → `transcripts` → `invites` → `recordings` → `files` → `feedback` → `meetingHosts` → `meeting`

**Success Response `200`:**

```json
{
  "statusCode": 200,
  "data": { "meeting_id": "cm..." },
  "message": "Meeting deleted successfully"
}
```

**Error Responses:**

| Code | Message |
|---|---|
| `400` | End the meeting before deleting it |
| `403` | Only the host can delete this meeting |
| `404` | Meeting not found |

---

## 16. Update Schedule

Updates scheduling details of a meeting. Only works while status is `scheduled` — stricter than `updateMeeting` with full field validation.

**Route:** `PATCH /:meeting_id/schedule-meeting/update`

**Auth:** Required (host only)

**Body:** All fields optional

```json
{
  "meeting_title":    "Rescheduled Sync",
  "scheduled_at":     "2026-07-15T14:00:00.000Z",
  "description":      "Updated agenda",
  "duration_minutes": 45,
  "max_participants": 15,
  "is_recorded":      false
}
```

**Validations:**
- `meeting_title` cannot be an empty string if provided
- `scheduled_at` must be a valid date and not in the past
- `duration_minutes` must be at least 1
- `max_participants` must be at least 2

**Success Response `200`:** Updated meeting object

**Error Responses:**

| Code | Message |
|---|---|
| `400` | Cannot update schedule of a meeting that is already ongoing/ended/cancelled |
| `400` | meeting_title cannot be empty |
| `400` | scheduled_at is not a valid date |
| `400` | scheduled_at cannot be in the past |
| `400` | duration_minutes must be at least 1 |
| `400` | max_participants must be at least 2 |
| `403` | Only the host can update this meeting |
| `404` | Meeting not found |

> **Difference from `updateMeeting`:** `updateSchedule` only works on `scheduled` meetings and validates all field values. `updateMeeting` works on `scheduled` + `ongoing` meetings but has no field-level validation.

---

## 17. Sync Calendar Invite

Returns a calendar event for Google Calendar, Outlook, or downloads an `.ics` file for Apple Calendar.

**Route:** `GET /:meeting_id/calendar`

**Auth:** Required

**Query Parameter:**

| Param | Values | Default | Description |
|---|---|---|---|
| `calendar_type` | `ics`, `google`, `outlook` | `ics` | Calendar format |

**Postman URLs:**

```
# Download .ics file (Apple Calendar / any client)
GET http://localhost:8000/api/v1/meeting/cm.../calendar?calendar_type=ics

# Google Calendar link
GET http://localhost:8000/api/v1/meeting/cm.../calendar?calendar_type=google

# Outlook Calendar link
GET http://localhost:8000/api/v1/meeting/cm.../calendar?calendar_type=outlook
```

**Success Response — Google `200`:**
```json
{
  "data": {
    "calendar_type":       "google",
    "google_calendar_url": "https://calendar.google.com/calendar/render?..."
  },
  "message": "Google Calendar link generated"
}
```

**Success Response — Outlook `200`:**
```json
{
  "data": {
    "calendar_type":        "outlook",
    "outlook_calendar_url": "https://outlook.live.com/calendar/..."
  },
  "message": "Outlook Calendar link generated"
}
```

**Success Response — ICS:** Downloads a `.ics` file directly (open with any calendar app)

**Error Responses:**

| Code | Message |
|---|---|
| `400` | Cannot sync calendar for an ended meeting |
| `404` | Meeting not found |

---

## Complete Route Reference

| Method | Route | Controller | Description |
|---|---|---|---|
| `POST` | `/create-meeting` | `createMeeting` | Start instant meeting |
| `POST` | `/schedule` | `scheduleMeeting` | Schedule future meeting |
| `POST` | `/join-meeting` | `joinMeeting` | Join via ID/code/link |
| `GET` | `/history` | `getMeetingHistory` | Paginated meeting history |
| `GET` | `/upcoming-meeting` | `getUpcomingMeetings` | List upcoming meetings |
| `GET` | `/:meeting_id` | `getMeetingDetails` | Full meeting details |
| `POST` | `/:meeting_id/add-co-host` | `addCoHost` | Assign co-host role |
| `POST` | `/:meeting_id/invite-link` | `generateInviteLink` | Get shareable link |
| `POST` | `/:meeting_id/invite-email` | `sendEmailInvite` | Email invite to users |
| `GET` | `/:meeting_id/participants` | `getMeetingParticipants` | List all participants |
| `DELETE` | `/:meeting_id/participants/:user_id/remove` | `removeParticipant` | Remove a participant |
| `PATCH` | `/:meeting_id/update` | `updateMeeting` | Update meeting fields |
| `POST` | `/:meeting_id/cancel` | `cancelMeeting` | Cancel meeting |
| `PATCH` | `/:meeting_id/end` | `endMeeting` | End for all participants |
| `DELETE` | `/:meeting_id/delete` | `deleteMeeting` | Permanently delete |
| `PATCH` | `/:meeting_id/schedule-meeting/update` | `updateSchedule` | Update schedule details |
| `GET` | `/:meeting_id/calendar` | `syncCalendarInvite` | Sync to calendar |

---

## Environment Variables Required

```env
EMAIL_USER=your@gmail.com
EMAIL_PASS=your_16_char_app_password
CLIENT_URL=http://localhost:3000
```

---

## Common Error Format

All errors follow this structure:

```json
{
  "statusCode": 400,
  "message":    "Error description here",
  "success":    false
}
```

## Helpers

| Helper | Purpose |
|---|---|
| `generateMeetingCode()` | Generates a random 8-character code e.g. `A3FZ9KQ1` |
| `generateMeetingLink(code)` | Builds a joinable URL e.g. `https://yourdomain.com/join/A3FZ9KQ1` |

---