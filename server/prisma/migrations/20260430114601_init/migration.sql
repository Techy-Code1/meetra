-- CreateTable
CREATE TABLE "Users" (
    "user_id" TEXT NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "first_name" VARCHAR(50),
    "last_name" VARCHAR(50),
    "profile_picture_url" VARCHAR(255),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Users_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "Roles" (
    "role_id" TEXT NOT NULL,
    "role_name" VARCHAR(50) NOT NULL,
    "description" TEXT,

    CONSTRAINT "Roles_pkey" PRIMARY KEY ("role_id")
);

-- CreateTable
CREATE TABLE "UserRoles" (
    "user_id" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserRoles_pkey" PRIMARY KEY ("user_id","role_id")
);

-- CreateTable
CREATE TABLE "RefreshTokens" (
    "token_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "device_info" VARCHAR(255),
    "ip_address" VARCHAR(45),
    "is_revoked" BOOLEAN NOT NULL DEFAULT false,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshTokens_pkey" PRIMARY KEY ("token_id")
);

-- CreateTable
CREATE TABLE "EmailVerificationTokens" (
    "token_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token" VARCHAR(255) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailVerificationTokens_pkey" PRIMARY KEY ("token_id")
);

-- CreateTable
CREATE TABLE "PasswordResetTokens" (
    "token_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token" VARCHAR(255) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetTokens_pkey" PRIMARY KEY ("token_id")
);

-- CreateTable
CREATE TABLE "AuthenticationLogs" (
    "log_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "action" VARCHAR(50) NOT NULL,
    "ip_address" VARCHAR(45),
    "user_agent" VARCHAR(255),
    "status" VARCHAR(20) NOT NULL DEFAULT 'success',
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthenticationLogs_pkey" PRIMARY KEY ("log_id")
);

-- CreateTable
CREATE TABLE "AuditLogs" (
    "audit_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "action" VARCHAR(100) NOT NULL,
    "entity_type" VARCHAR(50),
    "entity_id" VARCHAR(100),
    "details" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLogs_pkey" PRIMARY KEY ("audit_id")
);

-- CreateTable
CREATE TABLE "Meetings" (
    "meeting_id" TEXT NOT NULL,
    "host_id" TEXT NOT NULL,
    "meeting_title" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "meeting_code" VARCHAR(20),
    "meeting_link" VARCHAR(255),
    "status" VARCHAR(20) NOT NULL DEFAULT 'scheduled',
    "is_recorded" BOOLEAN NOT NULL DEFAULT false,
    "max_participants" INTEGER,
    "scheduled_at" TIMESTAMP(3) NOT NULL,
    "duration_minutes" INTEGER,
    "started_at" TIMESTAMP(3),
    "ended_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Meetings_pkey" PRIMARY KEY ("meeting_id")
);

-- CreateTable
CREATE TABLE "MeetingHosts" (
    "meeting_id" TEXT NOT NULL,
    "host_id" TEXT NOT NULL,

    CONSTRAINT "MeetingHosts_pkey" PRIMARY KEY ("meeting_id","host_id")
);

-- CreateTable
CREATE TABLE "Participants" (
    "participant_id" TEXT NOT NULL,
    "meeting_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "is_muted" BOOLEAN NOT NULL DEFAULT false,
    "is_video_on" BOOLEAN NOT NULL DEFAULT true,
    "is_host" BOOLEAN NOT NULL DEFAULT false,
    "joined_at" TIMESTAMP(3),
    "left_at" TIMESTAMP(3),

    CONSTRAINT "Participants_pkey" PRIMARY KEY ("participant_id")
);

-- CreateTable
CREATE TABLE "MeetingInvites" (
    "invite_id" TEXT NOT NULL,
    "meeting_id" TEXT NOT NULL,
    "invitee_email" VARCHAR(100) NOT NULL,
    "sent_at" TIMESTAMP(3),
    "responded_at" TIMESTAMP(3),
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',

    CONSTRAINT "MeetingInvites_pkey" PRIMARY KEY ("invite_id")
);

-- CreateTable
CREATE TABLE "Messages" (
    "message_id" TEXT NOT NULL,
    "meeting_id" TEXT NOT NULL,
    "sender_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "message_type" VARCHAR(20) NOT NULL DEFAULT 'text',
    "is_edited" BOOLEAN NOT NULL DEFAULT false,
    "edited_at" TIMESTAMP(3),
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Messages_pkey" PRIMARY KEY ("message_id")
);

-- CreateTable
CREATE TABLE "MeetingTranscripts" (
    "transcript_id" TEXT NOT NULL,
    "meeting_id" TEXT NOT NULL,
    "transcript_text" TEXT NOT NULL,
    "language" VARCHAR(10),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MeetingTranscripts_pkey" PRIMARY KEY ("transcript_id")
);

-- CreateTable
CREATE TABLE "BreakoutRooms" (
    "breakout_id" TEXT NOT NULL,
    "meeting_id" TEXT NOT NULL,
    "room_name" VARCHAR(50),
    "max_participants" INTEGER,
    "status" VARCHAR(20) NOT NULL DEFAULT 'open',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BreakoutRooms_pkey" PRIMARY KEY ("breakout_id")
);

-- CreateTable
CREATE TABLE "BreakoutRoomParticipants" (
    "breakout_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "joined_at" TIMESTAMP(3),
    "left_at" TIMESTAMP(3),

    CONSTRAINT "BreakoutRoomParticipants_pkey" PRIMARY KEY ("breakout_id","user_id")
);

-- CreateTable
CREATE TABLE "Recordings" (
    "recording_id" TEXT NOT NULL,
    "meeting_id" TEXT NOT NULL,
    "file_url" VARCHAR(255) NOT NULL,
    "file_size_mb" DOUBLE PRECISION,
    "duration_seconds" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Recordings_pkey" PRIMARY KEY ("recording_id")
);

-- CreateTable
CREATE TABLE "Files" (
    "file_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "meeting_id" TEXT,
    "file_name" VARCHAR(100) NOT NULL,
    "file_url" VARCHAR(255) NOT NULL,
    "file_type" VARCHAR(50),
    "file_size_mb" DOUBLE PRECISION,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Files_pkey" PRIMARY KEY ("file_id")
);

-- CreateTable
CREATE TABLE "Subscriptions" (
    "subscription_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "plan_name" VARCHAR(50),
    "price" DECIMAL(10,2),
    "currency" VARCHAR(10) NOT NULL DEFAULT 'USD',
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "started_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),

    CONSTRAINT "Subscriptions_pkey" PRIMARY KEY ("subscription_id")
);

-- CreateTable
CREATE TABLE "Payments" (
    "payment_id" TEXT NOT NULL,
    "subscription_id" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" VARCHAR(10) NOT NULL DEFAULT 'USD',
    "payment_method" VARCHAR(50),
    "status" VARCHAR(20) NOT NULL DEFAULT 'completed',
    "transaction_id" VARCHAR(100),
    "payment_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payments_pkey" PRIMARY KEY ("payment_id")
);

-- CreateTable
CREATE TABLE "Devices" (
    "device_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "device_name" VARCHAR(50),
    "device_type" VARCHAR(50),
    "os" VARCHAR(50),
    "browser" VARCHAR(50),
    "is_trusted" BOOLEAN NOT NULL DEFAULT false,
    "last_active_at" TIMESTAMP(3),

    CONSTRAINT "Devices_pkey" PRIMARY KEY ("device_id")
);

-- CreateTable
CREATE TABLE "Notifications" (
    "notification_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" VARCHAR(50),
    "message" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notifications_pkey" PRIMARY KEY ("notification_id")
);

-- CreateTable
CREATE TABLE "Settings" (
    "setting_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "setting_name" VARCHAR(50) NOT NULL,
    "setting_value" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("setting_id")
);

-- CreateTable
CREATE TABLE "Feedback" (
    "feedback_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "meeting_id" TEXT NOT NULL,
    "rating" INTEGER,
    "comments" TEXT,
    "is_anonymous" BOOLEAN NOT NULL DEFAULT false,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("feedback_id")
);

-- CreateTable
CREATE TABLE "Contacts" (
    "contact_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "contact_user_id" TEXT NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "added_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Contacts_pkey" PRIMARY KEY ("contact_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Users_username_key" ON "Users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Users_email_key" ON "Users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Roles_role_name_key" ON "Roles"("role_name");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshTokens_token_key" ON "RefreshTokens"("token");

-- CreateIndex
CREATE INDEX "RefreshTokens_user_id_idx" ON "RefreshTokens"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "EmailVerificationTokens_token_key" ON "EmailVerificationTokens"("token");

-- CreateIndex
CREATE INDEX "EmailVerificationTokens_user_id_idx" ON "EmailVerificationTokens"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetTokens_token_key" ON "PasswordResetTokens"("token");

-- CreateIndex
CREATE INDEX "PasswordResetTokens_user_id_idx" ON "PasswordResetTokens"("user_id");

-- CreateIndex
CREATE INDEX "AuthenticationLogs_user_id_idx" ON "AuthenticationLogs"("user_id");

-- CreateIndex
CREATE INDEX "AuditLogs_user_id_idx" ON "AuditLogs"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "Meetings_meeting_code_key" ON "Meetings"("meeting_code");

-- CreateIndex
CREATE INDEX "Meetings_host_id_idx" ON "Meetings"("host_id");

-- CreateIndex
CREATE INDEX "Meetings_status_idx" ON "Meetings"("status");

-- CreateIndex
CREATE INDEX "Participants_meeting_id_idx" ON "Participants"("meeting_id");

-- CreateIndex
CREATE INDEX "Participants_user_id_idx" ON "Participants"("user_id");

-- CreateIndex
CREATE INDEX "MeetingInvites_meeting_id_idx" ON "MeetingInvites"("meeting_id");

-- CreateIndex
CREATE INDEX "Messages_meeting_id_idx" ON "Messages"("meeting_id");

-- CreateIndex
CREATE INDEX "BreakoutRooms_meeting_id_idx" ON "BreakoutRooms"("meeting_id");

-- CreateIndex
CREATE INDEX "Recordings_meeting_id_idx" ON "Recordings"("meeting_id");

-- CreateIndex
CREATE INDEX "Files_user_id_idx" ON "Files"("user_id");

-- CreateIndex
CREATE INDEX "Subscriptions_user_id_idx" ON "Subscriptions"("user_id");

-- CreateIndex
CREATE INDEX "Payments_subscription_id_idx" ON "Payments"("subscription_id");

-- CreateIndex
CREATE INDEX "Devices_user_id_idx" ON "Devices"("user_id");

-- CreateIndex
CREATE INDEX "Notifications_user_id_idx" ON "Notifications"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "Settings_user_id_setting_name_key" ON "Settings"("user_id", "setting_name");

-- CreateIndex
CREATE INDEX "Feedback_meeting_id_idx" ON "Feedback"("meeting_id");

-- CreateIndex
CREATE UNIQUE INDEX "Contacts_user_id_contact_user_id_key" ON "Contacts"("user_id", "contact_user_id");

-- AddForeignKey
ALTER TABLE "UserRoles" ADD CONSTRAINT "UserRoles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "Users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRoles" ADD CONSTRAINT "UserRoles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "Roles"("role_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshTokens" ADD CONSTRAINT "RefreshTokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "Users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailVerificationTokens" ADD CONSTRAINT "EmailVerificationTokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "Users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordResetTokens" ADD CONSTRAINT "PasswordResetTokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "Users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthenticationLogs" ADD CONSTRAINT "AuthenticationLogs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "Users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLogs" ADD CONSTRAINT "AuditLogs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "Users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meetings" ADD CONSTRAINT "Meetings_host_id_fkey" FOREIGN KEY ("host_id") REFERENCES "Users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingHosts" ADD CONSTRAINT "MeetingHosts_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "Meetings"("meeting_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingHosts" ADD CONSTRAINT "MeetingHosts_host_id_fkey" FOREIGN KEY ("host_id") REFERENCES "Users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Participants" ADD CONSTRAINT "Participants_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "Meetings"("meeting_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Participants" ADD CONSTRAINT "Participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "Users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingInvites" ADD CONSTRAINT "MeetingInvites_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "Meetings"("meeting_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Messages" ADD CONSTRAINT "Messages_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "Meetings"("meeting_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Messages" ADD CONSTRAINT "Messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "Users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingTranscripts" ADD CONSTRAINT "MeetingTranscripts_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "Meetings"("meeting_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BreakoutRooms" ADD CONSTRAINT "BreakoutRooms_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "Meetings"("meeting_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BreakoutRoomParticipants" ADD CONSTRAINT "BreakoutRoomParticipants_breakout_id_fkey" FOREIGN KEY ("breakout_id") REFERENCES "BreakoutRooms"("breakout_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BreakoutRoomParticipants" ADD CONSTRAINT "BreakoutRoomParticipants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "Users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recordings" ADD CONSTRAINT "Recordings_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "Meetings"("meeting_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Files" ADD CONSTRAINT "Files_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "Users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Files" ADD CONSTRAINT "Files_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "Meetings"("meeting_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscriptions" ADD CONSTRAINT "Subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "Users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payments" ADD CONSTRAINT "Payments_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "Subscriptions"("subscription_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Devices" ADD CONSTRAINT "Devices_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "Users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notifications" ADD CONSTRAINT "Notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "Users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Settings" ADD CONSTRAINT "Settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "Users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "Users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "Meetings"("meeting_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contacts" ADD CONSTRAINT "Contacts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "Users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contacts" ADD CONSTRAINT "Contacts_contact_user_id_fkey" FOREIGN KEY ("contact_user_id") REFERENCES "Users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
