import { ApiError }    from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { transporter , sendInviteEmail } from "../utils/mailer.js";
import prisma           from "../db/index.js";

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

const generateMeetingCode = async () => {
  for (let i = 0; i < 5; i++) {
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    const exists = await prisma.meeting.findUnique({ where: { meeting_code: code } });
    if (!exists) return code;
  }
  throw new ApiError(500, "Failed to generate unique meeting code. Please try again.");
};

const generateMeetingLink = (code) =>
  `${process.env.CLIENT_URL}/join/${code}`;


// ─────────────────────────────────────────────
// Create Instant Meeting  –  POST /meeting/create-meeting
// No body required — just hit the endpoint and get a link
// ─────────────────────────────────────────────

const createMeeting = asyncHandler(async (req, res) => {
  const host_id = req.user.user_id;

  const {
    meeting_title,
    description      = null,
    max_participants = null,
    is_recorded      = false,
  } = req.body ?? {};

  const meeting_code = await generateMeetingCode();
  const meeting_link = generateMeetingLink(meeting_code);

  const now          = new Date();
  const defaultTitle = `Meeting ${new Date().toLocaleString("en-US", {
    month:  "short",
    day:    "numeric",
    hour:   "2-digit",
    minute: "2-digit",
  })}`;

  const meeting = await prisma.meeting.create({
    data: {
      host_id,
      meeting_title:   meeting_title?.trim() || defaultTitle,
      description,
      meeting_code,
      meeting_link,
      scheduled_at:    now,
      started_at:      now,
      status:          "ongoing",
      is_recorded,
      max_participants,
      meetingHosts: {
        create: { host_id },
      },
      participants: {
        create: {
          user_id:   host_id,
          is_host:   true,
          joined_at: now,
        },
      },
    },
    include: {
      host: {
        select: {
          user_id:             true,
          first_name:          true,
          last_name:           true,
          email:               true,
          profile_picture_url: true,
        },
      },
      meetingHosts: true,
      participants:  true,
    },
  });

  return res.status(201).json(
    new ApiResponse(
      201,
      {
        meeting_id:    meeting.meeting_id,
        meeting_code:  meeting.meeting_code,
        meeting_link:  meeting.meeting_link,
        meeting_title: meeting.meeting_title,
        status:        meeting.status,
        started_at:    meeting.started_at,
        host: {
          user_id:             meeting.host.user_id,
          first_name:          meeting.host.first_name,
          last_name:           meeting.host.last_name,
          profile_picture_url: meeting.host.profile_picture_url,
        },
      },
      "Meeting created — share the link to invite others"
    )
  );
});


// ─────────────────────────────────────────────
// Schedule Meeting  –  POST /meeting/schedule
// ─────────────────────────────────────────────

const scheduleMeeting = asyncHandler(async (req, res) => {
  const host_id = req.user.user_id;

  const {
    meeting_title,
    description      = null,
    scheduled_at,
    duration_minutes = 60,
    max_participants = null,
    is_recorded      = false,
    invite_emails    = [],
  } = req.body;

  if (!meeting_title?.trim())
    throw new ApiError(400, "meeting_title is required");

  if (!scheduled_at)
    throw new ApiError(400, "scheduled_at is required");

  const scheduledDate = new Date(scheduled_at);

  if (isNaN(scheduledDate.getTime()))
    throw new ApiError(400, "scheduled_at is not a valid date");

  if (scheduledDate < new Date())
    throw new ApiError(400, "scheduled_at cannot be in the past");

  const meeting_code = await generateMeetingCode();
  const meeting_link = generateMeetingLink(meeting_code);

  const meeting = await prisma.meeting.create({
    data: {
      host_id,
      meeting_title:   meeting_title.trim(),
      description,
      meeting_code,
      meeting_link,
      scheduled_at:    scheduledDate,
      duration_minutes,
      max_participants,
      is_recorded,
      status:          "scheduled",
      meetingHosts: { create: { host_id } },
      participants: {
        create: {
          user_id: host_id,
          is_host: true,
          // joined_at intentionally null — not started yet
        },
      },
      ...(invite_emails.length > 0 && {
        meetingInvites: {
          create: invite_emails.map((email) => ({
            invited_email: email.toLowerCase().trim(),
            invited_by:    host_id,
            status:        "pending",
          })),
        },
      }),
    },
    include: {
      host: {
        select: {
          user_id:             true,
          first_name:          true,
          last_name:           true,
          email:               true,
          profile_picture_url: true,
        },
      },
      meetingHosts:   true,
      participants:   true,
      meetingInvites: true,
    },
  });

  return res.status(201).json(
    new ApiResponse(201, meeting, "Meeting scheduled successfully")
  );
});


// ─────────────────────────────────────────────
// Join Meeting  –  POST /meeting/join-meeting
// ─────────────────────────────────────────────

const joinMeeting = asyncHandler(async (req, res) => {
  const { meeting_id, meeting_code, meeting_link } = req.body;
  const user_id = req.user.user_id;

  if (!meeting_id && !meeting_code && !meeting_link)
    throw new ApiError(400, "Provide meeting_id or meeting_code or meeting_link");

  const meeting = await prisma.meeting.findFirst({
    where:
      meeting_id   ? { meeting_id }   :
      meeting_code ? { meeting_code } :
                     { meeting_link },
    include: { participants: true },
  });

  if (!meeting)
    throw new ApiError(404, "Meeting not found");

  if (["ended", "cancelled"].includes(meeting.status))
    throw new ApiError(400, `Cannot join a meeting that is ${meeting.status}`);

  // ── Capacity check (count from DB to avoid race condition) ─────
  const participantCount = await prisma.participant.count({ where: { meeting_id: meeting.meeting_id } });
  if (meeting.max_participants && participantCount >= meeting.max_participants)
    throw new ApiError(400, "Meeting is at full capacity");

  const existingParticipant = meeting.participants.find(
    (p) => p.user_id === user_id
  );

  const participant = existingParticipant
    ? await prisma.participant.update({
        where: { participant_id: existingParticipant.participant_id },
        data:  { joined_at: new Date(), left_at: null },
      })
    : await prisma.participant.create({
        data: {
          meeting_id: meeting.meeting_id,
          user_id,
          is_host:    meeting.host_id === user_id,
          joined_at:  new Date(),
        },
      });

  // Auto-transition scheduled → ongoing on first join
  if (meeting.status === "scheduled") {
    await prisma.meeting.update({
      where: { meeting_id: meeting.meeting_id },
      data:  { status: "ongoing", started_at: new Date() },
    });
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        meeting_id:    meeting.meeting_id,
        meeting_code:  meeting.meeting_code,
        meeting_title: meeting.meeting_title,
        meeting_link:  meeting.meeting_link,
        participant,
      },
      "Joined meeting successfully"
    )
  );
});


// ─────────────────────────────────────────────
// End Meeting  –  PATCH /meeting/:meeting_id/end
// ─────────────────────────────────────────────

const endMeeting = asyncHandler(async (req, res) => {
  const { meeting_id } = req.params;
  const requester_id   = req.user.user_id;

  const meeting = await prisma.meeting.findUnique({ where: { meeting_id } });

  if (!meeting)
    throw new ApiError(404, "Meeting not found");

  if (meeting.host_id !== requester_id)
    throw new ApiError(403, "Only the host can end this meeting");

  if (meeting.status === "ended")
    throw new ApiError(400, "Meeting already ended");

  if (meeting.status === "scheduled")
    throw new ApiError(400, "Meeting has not started yet. Start the meeting before ending it");

  const ended_at = new Date();

  const [updatedMeeting] = await prisma.$transaction([
    prisma.meeting.update({
      where: { meeting_id },
      data:  { status: "ended", ended_at },
    }),
    prisma.participant.updateMany({
      where: { meeting_id, left_at: null, joined_at: { not: null } },
      data:  { left_at: ended_at },
    }),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        meeting_id,
        status:   "ended",
        ended_at: updatedMeeting.ended_at,
      },
      "Meeting ended for all participants"
    )
  );
});


// ─────────────────────────────────────────────
// Update Schedule  –  PATCH /meeting/:meeting_id/schedule
// Only allowed while status = "scheduled"
// ─────────────────────────────────────────────

const updateSchedule = asyncHandler(async (req, res) => {
  const { meeting_id } = req.params;
  const requester_id   = req.user.user_id;

  const {
    meeting_title,
    description,
    scheduled_at,
    duration_minutes,
    max_participants,
    is_recorded,
  } = req.body;

  const meeting = await prisma.meeting.findUnique({ where: { meeting_id } });

  if (!meeting)
    throw new ApiError(404, "Meeting not found");

  if (meeting.host_id !== requester_id)
    throw new ApiError(403, "Only the host can update this meeting");

  if (meeting.status !== "scheduled")
    throw new ApiError(400, `Cannot update schedule of a meeting that is already ${meeting.status}`);

  if (meeting_title !== undefined && !meeting_title?.trim())
    throw new ApiError(400, "meeting_title cannot be empty");

  let parsedScheduledAt;
  if (scheduled_at !== undefined) {
    parsedScheduledAt = new Date(scheduled_at);
    if (isNaN(parsedScheduledAt.getTime()))
      throw new ApiError(400, "scheduled_at is not a valid date");
    if (parsedScheduledAt < new Date())
      throw new ApiError(400, "scheduled_at cannot be in the past");
  }

  if (duration_minutes !== undefined && duration_minutes < 1)
    throw new ApiError(400, "duration_minutes must be at least 1");

  if (max_participants !== undefined && max_participants < 2)
    throw new ApiError(400, "max_participants must be at least 2");

  const updated = await prisma.meeting.update({
    where: { meeting_id },
    data: {
      ...(meeting_title    !== undefined && { meeting_title: meeting_title.trim() }),
      ...(description      !== undefined && { description }),
      ...(scheduled_at     !== undefined && { scheduled_at: parsedScheduledAt }),
      ...(duration_minutes !== undefined && { duration_minutes }),
      ...(max_participants !== undefined && { max_participants }),
      ...(is_recorded      !== undefined && { is_recorded }),
    },
  });

  return res.status(200).json(
    new ApiResponse(200, updated, "Meeting schedule updated successfully")
  );
});


// ─────────────────────────────────────────────
// Cancel Meeting  –  PATCH /meeting/:meeting_id/cancel
// ─────────────────────────────────────────────

const cancelMeeting = asyncHandler(async (req, res) => {
  const { meeting_id } = req.params;
  const requester_id   = req.user.user_id;
  const { reason }     = req.body;

  const meeting = await prisma.meeting.findUnique({ where: { meeting_id } });

  if (!meeting)
    throw new ApiError(404, "Meeting not found");

  if (meeting.host_id !== requester_id)
    throw new ApiError(403, "Only the host can cancel this meeting");

  if (meeting.status === "ongoing")
    throw new ApiError(400, "Cannot cancel an ongoing meeting — end it instead");

  if (["ended", "cancelled"].includes(meeting.status))
    throw new ApiError(400, `Meeting is already ${meeting.status}`);

  const [cancelled] = await prisma.$transaction([
    prisma.meeting.update({
      where: { meeting_id },
      data: {
        status:      "cancelled",
        description: reason ? `[Cancelled] ${reason}` : meeting.description,
      },
    }),
    prisma.meetingInvite.updateMany({
      where: { meeting_id, status: "pending" },
      data:  { status: "cancelled" },
    }),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        meeting_id,
        status:       cancelled.status,
        reason:       reason ?? null,
        cancelled_at: new Date(),
      },
      "Meeting cancelled successfully"
    )
  );
});


// ─────────────────────────────────────────────
// Get Upcoming Meetings  –  GET /meeting/upcoming
// Query: page, limit, from_date, to_date
// ─────────────────────────────────────────────

const getUpcomingMeetings = asyncHandler(async (req, res) => {
  const host_id = req.user.user_id;

  const { page = 1, limit = 10, from_date, to_date } = req.query;

  const pageNum  = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const skip     = (pageNum - 1) * limitNum;
  const now      = new Date();

  const where = {
    host_id,
    status:       "scheduled",
    scheduled_at: {
      gte: from_date ? new Date(from_date) : now,
      ...(to_date && { lte: new Date(to_date) }),
    },
  };

  const [meetings, total] = await prisma.$transaction([
    prisma.meeting.findMany({
      where,
      skip,
      take:    limitNum,
      orderBy: { scheduled_at: "asc" },
      include: {
        host: {
          select: {
            user_id:             true,
            first_name:          true,
            last_name:           true,
            email:               true,
            profile_picture_url: true,
          },
        },
        _count: {
          select: {
            participants:   true,
            meetingInvites: true,
          },
        },
      },
    }),
    prisma.meeting.count({ where }),
  ]);

  const enriched = meetings.map((m) => {
    const msUntil   = new Date(m.scheduled_at) - now;
    const mins      = Math.floor(msUntil / 60000);
    const hours     = Math.floor(mins / 60);
    const days      = Math.floor(hours / 24);

    const starts_in =
      days  > 0 ? `${days}d ${hours % 24}h` :
      hours > 0 ? `${hours}h ${mins % 60}m` :
      mins  > 0 ? `${mins}m`                :
                  "Starting now";

    return { ...m, starts_in };
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        meetings: enriched,
        meta: {
          total,
          page:       pageNum,
          limit:      limitNum,
          totalPages: Math.ceil(total / limitNum),
        },
      },
      "Upcoming meetings fetched successfully"
    )
  );
});


// ─────────────────────────────────────────────
// Get Meeting Details  –  GET /meeting/:meeting_id
// ─────────────────────────────────────────────

const getMeetingDetails = asyncHandler(async (req, res) => {
  const { meeting_id } = req.params;

  const meeting = await prisma.meeting.findUnique({
    where: { meeting_id },
    include: {
      host: {
        select: {
          user_id:             true,
          first_name:          true,
          last_name:           true,
          email:               true,
          profile_picture_url: true,
        },
      },
      meetingHosts: {
        include: {
          host: { select: { user_id: true, first_name: true, last_name: true, email: true } },
        },
      },
      participants: {
        include: {
          user: { select: { user_id: true, first_name: true, last_name: true, email: true, profile_picture_url: true } },
        },
      },
      breakoutRooms:      { include: { participants: true } },
      recordings:         true,
      meetingTranscripts: true,
      meetingInvites:     true,
      files:              true,
      feedback: {
        where:   { is_anonymous: false },
        include: { user: { select: { first_name: true, last_name: true } } },
      },
      _count: { select: { participants: true, recordings: true, messages: true } },
    },
  });

  if (!meeting)
    throw new ApiError(404, "Meeting not found");

  return res.status(200).json(
    new ApiResponse(200, meeting, "Meeting details fetched successfully")
  );
});


// ─────────────────────────────────────────────
// Get Meeting History  –  GET /meeting/history
// Query: status, search, from_date, to_date, page, limit
// ─────────────────────────────────────────────

const getMeetingHistory = asyncHandler(async (req, res) => {
  const { status, search, from_date, to_date, page = 1, limit = 10 } = req.query;
  const host_id = req.user.user_id;

  const pageNum  = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const skip     = (pageNum - 1) * limitNum;

  const where = {
    host_id,
    ...(status && { status }),
    ...(search && { meeting_title: { contains: search, mode: "insensitive" } }),
    ...(from_date || to_date
      ? { scheduled_at: {
          ...(from_date && { gte: new Date(from_date) }),
          ...(to_date   && { lte: new Date(to_date) }),
        }}
      : {}),
  };

  const [meetings, total] = await prisma.$transaction([
    prisma.meeting.findMany({
      where,
      skip,
      take:    limitNum,
      orderBy: { scheduled_at: "desc" },
      include: {
        host:   { select: { user_id: true, first_name: true, last_name: true, email: true, profile_picture_url: true } },
        _count: { select: { participants: true, recordings: true, files: true } },
      },
    }),
    prisma.meeting.count({ where }),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        meetings,
        meta: {
          total,
          page:       pageNum,
          limit:      limitNum,
          totalPages: Math.ceil(total / limitNum),
        },
      },
      "Meeting history fetched successfully"
    )
  );
});


// ─────────────────────────────────────────────
// Update Meeting  –  PATCH /meeting/:meeting_id
// ─────────────────────────────────────────────

const updateMeeting = asyncHandler(async (req, res) => {
  const { meeting_id } = req.params;
  const requester_id   = req.user.user_id;

  // NOTE: status is intentionally excluded — use dedicated endpoints
  const {
    meeting_title,
    description,
    scheduled_at,
    duration_minutes,
    max_participants,
    is_recorded,
  } = req.body;

  const meeting = await prisma.meeting.findUnique({ where: { meeting_id } });

  if (!meeting)
    throw new ApiError(404, "Meeting not found");

  if (meeting.host_id !== requester_id)
    throw new ApiError(403, "Only the host can update this meeting");

  if (meeting.status === "ended")
    throw new ApiError(400, "Cannot update an ended meeting");

  const updated = await prisma.meeting.update({
    where: { meeting_id },
    data: {
      ...(meeting_title    !== undefined && { meeting_title }),
      ...(description      !== undefined && { description }),
      ...(scheduled_at     !== undefined && { scheduled_at: new Date(scheduled_at) }),
      ...(duration_minutes !== undefined && { duration_minutes }),
      ...(max_participants !== undefined && { max_participants }),
      ...(is_recorded      !== undefined && { is_recorded }),
    },
  });

  return res.status(200).json(
    new ApiResponse(200, updated, "Meeting updated successfully")
  );
});


// ─────────────────────────────────────────────
// Delete Meeting  –  DELETE /meeting/:meeting_id
// ─────────────────────────────────────────────

const deleteMeeting = asyncHandler(async (req, res) => {
  const { meeting_id } = req.params;
  const requester_id   = req.user.user_id;

  const meeting = await prisma.meeting.findUnique({ where: { meeting_id } });

  if (!meeting)
    throw new ApiError(404, "Meeting not found");

  if (meeting.host_id !== requester_id)
    throw new ApiError(403, "Only the host can delete this meeting");

  if (meeting.status === "ongoing")
    throw new ApiError(400, "End the meeting before deleting it");

  await prisma.$transaction([
    prisma.breakoutRoomParticipant.deleteMany({ where: { breakoutRoom: { meeting_id } } }),
    prisma.breakoutRoom.deleteMany(           { where: { meeting_id } }),
    prisma.participant.deleteMany(            { where: { meeting_id } }),
    prisma.message.deleteMany(               { where: { meeting_id } }),
    prisma.meetingTranscript.deleteMany(     { where: { meeting_id } }),
    prisma.meetingInvite.deleteMany(         { where: { meeting_id } }),
    prisma.recording.deleteMany(             { where: { meeting_id } }),
    prisma.file.deleteMany(                  { where: { meeting_id } }),
    prisma.feedback.deleteMany(              { where: { meeting_id } }),
    prisma.meetingHost.deleteMany(           { where: { meeting_id } }),
    prisma.meeting.delete(                   { where: { meeting_id } }),
  ]);

  return res.status(200).json(
    new ApiResponse(200, { meeting_id }, "Meeting deleted successfully")
  );
});


// ─────────────────────────────────────────────
// Get Meeting Participants  –  GET /meeting/:meeting_id/participants
// ─────────────────────────────────────────────

const getMeetingParticipants = asyncHandler(async (req, res) => {
  const { meeting_id } = req.params;

  const meeting = await prisma.meeting.findUnique({ where: { meeting_id } });

  if (!meeting)
    throw new ApiError(404, "Meeting not found");

  const participants = await prisma.participant.findMany({
    where:   { meeting_id },
    include: {
      user: { select: { user_id: true, first_name: true, last_name: true, email: true, profile_picture_url: true } },
    },
    orderBy: { joined_at: "asc" },
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      { participants, total: participants.length },
      "Participants fetched successfully"
    )
  );
});


// ─────────────────────────────────────────────
// 1. Generate Invite Link  –  POST /meeting/:meeting_id/invite-link
// Returns a shareable join link with optional expiry
// ─────────────────────────────────────────────

const generateInviteLink = asyncHandler(async (req, res) => {
  const requester_id   = req.user.user_id;
  const { meeting_id } = req.params;
  const { expires_in_hours = 24 } = req.body; // default 24h expiry

  // ── Fetch & guard ──────────────────────────
  const meeting = await prisma.meeting.findUnique({ where: { meeting_id } });

  if (!meeting)
    throw new ApiError(404, "Meeting not found");

  if (meeting.host_id !== requester_id)
    throw new ApiError(403, "Only the host can generate an invite link");

  if (["ended", "cancelled"].includes(meeting.status))
    throw new ApiError(400, `Cannot generate invite link for a ${meeting.status} meeting`);

  // ── Build invite link with expiry metadata ─
  const expires_at = new Date(Date.now() + expires_in_hours * 60 * 60 * 1000);

  // Store invite record in DB
const invite = await prisma.meetingInvite.create({
  data: {
    meeting_id,
    invitee_email: `invite+${meeting.meeting_code}@meetra.app`, // placeholder for link-only invites
    status:        "pending",
    sent_at:       new Date(),
  },
});

  const invite_link = `${process.env.CLIENT_URL}/join/${meeting.meeting_code}?invite=${invite.invite_id}`;

  return res.status(201).json(
    new ApiResponse(
      201,
      {
        invite_id:    invite.invite_id,
        invite_link,
        meeting_code: meeting.meeting_code,
        meeting_link: meeting.meeting_link,
        expires_at,
        expires_in:   `${expires_in_hours} hours`,
      },
      "Invite link generated successfully"
    )
  );
});


// ─────────────────────────────────────────────
// 2. Send Email Invite  –  POST /meeting/:meeting_id/invite-email
// Sends a meeting invite email to one or more emails
// ─────────────────────────────────────────────

const sendEmailInvite = asyncHandler(async (req, res) => {
  const { meeting_id } = req.params;
  const requester_id   = req.user.user_id;

  const { emails = [], message = "" } = req.body;

  // ── Validations ────────────────────────────────────────────────
  if (!emails.length)
    throw new ApiError(400, "Provide at least one email address");

  if (emails.length > 50)
    throw new ApiError(400, "Cannot send more than 50 invites at once");

  const emailRegex    = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const invalidEmails = emails.filter((e) => !emailRegex.test(e));
  if (invalidEmails.length)
    throw new ApiError(400, `Invalid email addresses: ${invalidEmails.join(", ")}`);

  // ── Fetch meeting & guard ──────────────────────────────────────
  const meeting = await prisma.meeting.findUnique({
    where:   { meeting_id },
    include: {
      host: {
        select: { first_name: true, last_name: true, email: true },
      },
    },
  });

  if (!meeting)
    throw new ApiError(404, "Meeting not found");

  if (meeting.host_id !== requester_id)
    throw new ApiError(403, "Only the host can send invites");

  if (["ended", "cancelled"].includes(meeting.status))
    throw new ApiError(400, `Cannot invite to a ${meeting.status} meeting`);

  // ── Prepare shared email data ──────────────────────────────────
  const host_name = `${meeting.host.first_name} ${meeting.host.last_name}`;

  // ── Process each email — DB record + send email ────────────────
  const results = await Promise.allSettled(
    emails.map(async (email) => {
      const normalizedEmail = email.toLowerCase().trim();

      // ── Upsert invite record ───────────────────────────────────
      const existingInvite = await prisma.meetingInvite.findFirst({
        where: { meeting_id, invitee_email: normalizedEmail },
      });

      if (existingInvite) {
        await prisma.meetingInvite.update({
          where: { invite_id: existingInvite.invite_id },
          data:  { status: "pending", sent_at: new Date() },
        });
      } else {
        await prisma.meetingInvite.create({
          data: {
            meeting_id,
            invitee_email: normalizedEmail,
            status:        "pending",
            sent_at:       new Date(),
          },
        });
      }

      // ── Send email via shared utility ──────────────────────────
      await sendInviteEmail({
        to_email:         normalizedEmail,
        host_name,
        meeting_title:    meeting.meeting_title,
        description:      meeting.description,
        scheduled_at:     meeting.scheduled_at,
        duration_minutes: meeting.duration_minutes,
        meeting_link:     meeting.meeting_link,
        meeting_code:     meeting.meeting_code,
        message,
      });

      return normalizedEmail;
    })
  );

  // ── Separate succeeded / failed ────────────────────────────────
  const sent   = results
    .filter((r) => r.status === "fulfilled")
    .map((r) => r.value);

  const failed = results
    .filter((r) => r.status === "rejected")
    .map((_, i) => emails[i]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        sent_count:   sent.length,
        failed_count: failed.length,
        sent,
        failed,
      },
      failed.length === 0
        ? "All invites sent successfully"
        : `${sent.length} invite(s) sent, ${failed.length} failed`
    )
  );
});


// ─────────────────────────────────────────────
// 3. Add Co-Host  –  POST /meeting/:meeting_id/co-host
// Assigns co-host role to an existing participant
// ─────────────────────────────────────────────


const addCoHost = asyncHandler(async (req, res) => {
  const { meeting_id } = req.params;
  const requester_id   = req.user.user_id;

  const { user_id } = req.body;

  // ── Validations ────────────────────────────
  if (!user_id)
    throw new ApiError(400, "user_id is required");

  if (user_id === requester_id)
    throw new ApiError(400, "You are already the host");

  // ── Fetch & guard ──────────────────────────
  const meeting = await prisma.meeting.findUnique({
    where:   { meeting_id },
    include: { meetingHosts: true },
  });

  if (!meeting)
    throw new ApiError(404, "Meeting not found");

  if (meeting.host_id !== requester_id)
    throw new ApiError(403, "Only the host can assign co-hosts");

  if (["ended", "cancelled"].includes(meeting.status))
    throw new ApiError(400, `Cannot add co-host to a ${meeting.status} meeting`);

  // ── Check user exists ──────────────────────
  const user = await prisma.user.findUnique({ where: { user_id } });
  if (!user)
    throw new ApiError(404, "User not found");

  // ── Check already a co-host ────────────────
  const alreadyCoHost = meeting.meetingHosts.some((h) => h.host_id === user_id);
  if (alreadyCoHost)
    throw new ApiError(400, "User is already a co-host");

  // ── Add to meetingHosts + update participant flag atomically ───
  const [coHost] = await prisma.$transaction([
    prisma.meetingHost.create({
      data: { meeting_id, host_id: user_id },
    }),
    // If already a participant, flip is_host flag
    prisma.participant.updateMany({
      where: { meeting_id, user_id },
      data:  { is_host: true },
    }),
  ]);

  return res.status(201).json(
    new ApiResponse(
      201,
      {
        meeting_id,
        co_host: {
          user_id:    user.user_id,
          first_name: user.first_name,
          last_name:  user.last_name,
          email:      user.email,
        },
      },
      "Co-host added successfully"
    )
  );
});


// ─────────────────────────────────────────────
// 4. Remove Participant  –  DELETE /meeting/:meeting_id/participant/:user_id
// Host removes a participant from the meeting
// ─────────────────────────────────────────────

const removeParticipant = asyncHandler(async (req, res) => {
  const { meeting_id, user_id } = req.params;
  const requester_id            = req.user.user_id;

  // ── Fetch & guard ──────────────────────────
  const meeting = await prisma.meeting.findUnique({ where: { meeting_id } });

  if (!meeting)
    throw new ApiError(404, "Meeting not found");

  if (meeting.host_id !== requester_id)
    throw new ApiError(403, "Only the host can remove participants");

  if (meeting.status === "ended")
    throw new ApiError(400, "Cannot remove participants from an ended meeting");

  if (user_id === requester_id)
    throw new ApiError(400, "Host cannot remove themselves — end the meeting instead");

  // ── Check participant exists ───────────────
  const participant = await prisma.participant.findFirst({
    where: { meeting_id, user_id },
  });

  if (!participant)
    throw new ApiError(404, "Participant not found in this meeting");

  // ── Remove participant + cancel their invite + remove co-host if applicable ──
  await prisma.$transaction([
    // Stamp left_at instead of hard delete (keeps history)
    prisma.participant.updateMany({
      where: { meeting_id, user_id },
      data:  { left_at: new Date() },
    }),
    // Cancel any pending invite
    prisma.meetingInvite.updateMany({
      where: { meeting_id, invited_email: { not: null } },
      data:  { status: "cancelled" },
    }),
    // Remove co-host role if they had one
    prisma.meetingHost.deleteMany({
      where: { meeting_id, host_id: user_id },
    }),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      { meeting_id, removed_user_id: user_id },
      "Participant removed successfully"
    )
  );
});

// ─────────────────────────────────────────────
// 5. Sync Calendar Invite  –  POST /meeting/:meeting_id/calendar
// Returns a downloadable .ics file for Google/Outlook/Apple Calendar
// ─────────────────────────────────────────────

const syncCalendarInvite = asyncHandler(async (req, res) => {
  const { meeting_id } = req.params;
  const requester_id   = req.user.user_id;

  const { calendar_type = "ics" } = req.query; // "ics" | "google" | "outlook"

  // ── Fetch & guard ──────────────────────────
  const meeting = await prisma.meeting.findUnique({
    where:   { meeting_id },
    include: {
      host: { select: { first_name: true, last_name: true, email: true } },
    },
  });

  if (!meeting)
    throw new ApiError(404, "Meeting not found");

  if (meeting.status === "ended")
    throw new ApiError(400, "Cannot sync calendar for an ended meeting");

  // ── Build calendar data ────────────────────
  const startTime  = new Date(meeting.scheduled_at);
  const endTime    = new Date(
    startTime.getTime() + (meeting.duration_minutes ?? 60) * 60 * 1000
  );

  const formatICSDate = (date) =>
    date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

  // ── Google Calendar link ───────────────────
  if (calendar_type === "google") {
    const params = new URLSearchParams({
      action:   "TEMPLATE",
      text:     meeting.meeting_title,
      dates:    `${formatICSDate(startTime)}/${formatICSDate(endTime)}`,
      details:  `${meeting.description ?? ""}\n\nJoin link: ${meeting.meeting_link}\nMeeting code: ${meeting.meeting_code}`,
      location: meeting.meeting_link,
    });

    const google_calendar_url = `https://calendar.google.com/calendar/render?${params.toString()}`;

    return res.status(200).json(
      new ApiResponse(
        200,
        { calendar_type: "google", google_calendar_url },
        "Google Calendar link generated"
      )
    );
  }

  // ── Outlook Calendar link ──────────────────
  if (calendar_type === "outlook") {
    const params = new URLSearchParams({
      path:      "/calendar/action/compose",
      rru:       "addevent",
      subject:   meeting.meeting_title,
      startdt:   startTime.toISOString(),
      enddt:     endTime.toISOString(),
      body:      `${meeting.description ?? ""}\n\nJoin: ${meeting.meeting_link}`,
      location:  meeting.meeting_link,
    });

    const outlook_calendar_url = `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;

    return res.status(200).json(
      new ApiResponse(
        200,
        { calendar_type: "outlook", outlook_calendar_url },
        "Outlook Calendar link generated"
      )
    );
  }

  // ── ICS file (works for Apple Calendar, any client) ───────────
  const icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Meetra//Meeting//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    `UID:${meeting_id}@meetra`,
    `DTSTAMP:${formatICSDate(new Date())}`,
    `DTSTART:${formatICSDate(startTime)}`,
    `DTEND:${formatICSDate(endTime)}`,
    `SUMMARY:${meeting.meeting_title}`,
    `DESCRIPTION:${meeting.description ?? ""}\\nJoin: ${meeting.meeting_link}\\nCode: ${meeting.meeting_code}`,
    `LOCATION:${meeting.meeting_link}`,
    `ORGANIZER;CN=${meeting.host.first_name} ${meeting.host.last_name}:mailto:${meeting.host.email}`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  // Send as downloadable file
  res.setHeader("Content-Type",        "text/calendar; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${meeting.meeting_code}.ics"`);
  return res.status(200).send(icsContent);
});



export {
  createMeeting,
  scheduleMeeting,
  joinMeeting,
  endMeeting,
  updateSchedule,
  cancelMeeting,
  getUpcomingMeetings,
  getMeetingDetails,
  getMeetingHistory,
  updateMeeting,
  deleteMeeting,
  getMeetingParticipants,
  generateInviteLink,
  sendEmailInvite,
  addCoHost,
  removeParticipant,
  syncCalendarInvite,
};