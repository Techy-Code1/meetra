import { ApiError }    from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import prisma           from "../db/index.js";
// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

const generateMeetingCode = () =>
  Math.random().toString(36).substring(2, 10).toUpperCase(); // e.g. "A3FZ9KQ1"

const generateMeetingLink = (code) =>
  `${process.env.CLIENT_URL}/join/${code}`;

// ─────────────────────────────────────────────
// Create Meeting  –  POST /meetings
// ─────────────────────────────────────────────
const createMeeting = asyncHandler(async (req, res) => {
  const {
    meeting_title,
    description,
    scheduled_at,
    duration_minutes,
    max_participants,
    is_recorded = false,
  } = req.body;

  const host_id = req.user.user_id;

  if (!meeting_title || !scheduled_at) {
    throw new ApiError(400, "meeting_title and scheduled_at are required");
  }

  if (new Date(scheduled_at) < new Date()) {
  throw new ApiError(400, "Scheduled time cannot be in the past");
}

  const meeting_code = generateMeetingCode();
  const meeting_link = generateMeetingLink(meeting_code);

  const meeting = await prisma.meeting.create({
    data: {
      host_id,
      meeting_title,
      description,
      meeting_code,
      meeting_link,
      scheduled_at: new Date(scheduled_at),
      duration_minutes,
      max_participants,
      is_recorded,
      status: "scheduled",
      meetingHosts: { create: { host_id } },
      participants: { create: { user_id: host_id, is_host: true } },
    },
    include: {
      host: {
        select: {
          user_id: true,
          first_name: true,
          last_name: true,
          email: true,
          profile_picture_url: true,
        },
      },
      meetingHosts: true,
      participants: true,
    },
  });

  return res
    .status(201)
    .json(new ApiResponse(201, meeting, "Meeting created successfully"));
});


 
// ─────────────────────────────────────────────
// Join Meeting  –  POST /meetings/join
// ─────────────────────────────────────────────
 
const joinMeeting = asyncHandler(async (req, res) => {

  const { meeting_id, meeting_code, meeting_link } = req.body;

  const user_id = req.user.user_id;


  // Validation
  if (!meeting_id && !meeting_code && !meeting_link) {
    throw new ApiError(
      400,
      "Provide meeting_id or meeting_code or meeting_link"
    );
  }


  // Find meeting

  const meeting = await prisma.meeting.findFirst({
    where:
      meeting_id
        ? { meeting_id }
        : meeting_code
        ? { meeting_code }
        : { meeting_link },

    include: {
      participants: true,
    },
  });


  // Meeting exists?

  if (!meeting) {
    throw new ApiError(404, "Meeting not found");
  }


  // Check meeting status

  if (["ended", "cancelled"].includes(meeting.status)) {
    throw new ApiError(
      400,
      `Cannot join a meeting that is ${meeting.status}`
    );
  }

  // Capacity check

  if (
    meeting.max_participants &&
    meeting.participants.length >= meeting.max_participants
  ) {
    throw new ApiError(400, "Meeting is at full capacity");
  }


  // Check existing participant

  const existingParticipant = meeting.participants.find(
    (participant) => participant.user_id === user_id
  );


  // Rejoin OR Create participant

  const participant = existingParticipant

    ? await prisma.participant.update({
        where: {
          participant_id: existingParticipant.participant_id,
        },

        data: {
          joined_at: new Date(),
          left_at: null,
        },
      })

    : await prisma.participant.create({
        data: {
          meeting_id: meeting.meeting_id,
          user_id,

          is_host: meeting.host_id === user_id,

          joined_at: new Date(),
        },
      });

  // scheduled -> ongoing
  if (meeting.status === "scheduled") {
    await prisma.meeting.update({
      where: {
        meeting_id: meeting.meeting_id,
      },

      data: {
        status: "ongoing",
        started_at: new Date(),
      },
    });
  }


  // Response

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        meeting_id: meeting.meeting_id,
        meeting_code: meeting.meeting_code,
        meeting_title: meeting.meeting_title,
        meeting_link: meeting.meeting_link,
        participant,
      },

      "Joined meeting successfully"
    )
  );
});
 
 
// ─────────────────────────────────────────────
// End Meeting  –  PATCH /meetings/:id/end
// ─────────────────────────────────────────────
 
const endMeeting = asyncHandler(async (req, res) => {
  const { meeting_id } = req.params;
  const requester_id = req.user.user_id;

  const meeting = await prisma.meeting.findUnique({ where: { meeting_id } });

  // ── Validation guards ──────────────────────────────────────────
  if (!meeting)
    throw new ApiError(404, "Meeting not found");

  if (meeting.host_id !== requester_id)
    throw new ApiError(403, "Only the host can end this meeting");

  if (meeting.status === "ended")
    throw new ApiError(400, "Meeting already ended");

  if (meeting.status === "scheduled")
    throw new ApiError(400, "Meeting has not started yet. Start the meeting before ending it");

  // ── Atomic transaction ─────────────────────────────────────────
  const ended_at = new Date();

  const [updatedMeeting] = await prisma.$transaction([
    prisma.meeting.update({
      where: { meeting_id },
      data:  { status: "ended", ended_at },
    }),

    // Only stamp participants who actually joined (joined_at is not null)
    prisma.participant.updateMany({
      where: {
        meeting_id,
        left_at:   null,
        joined_at: { not: null },   // ← fix: skip ghost participants
      },
      data: { left_at: ended_at },  // ← fix: same timestamp as meeting
    }),
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        {
          meeting_id,
          status:    "ended",               // ← added for clarity
          ended_at:  updatedMeeting.ended_at,
        },
        "Meeting ended for all participants"
      )
    );
});
 
 
// ─────────────────────────────────────────────
// Get Meeting Details  –  GET /meetings/:id
// ─────────────────────────────────────────────
 
const getMeetingDetails = asyncHandler(async (req, res) => {
  // extract the meeting_id from req.params
  const { meeting_id } = req.params;
 
  // find the meeting using meeting_id
  const meeting = await prisma.meeting.findUnique({
    where: { meeting_id },
    include: {
      host: {
        select: {
          user_id: true,
          first_name: true,
          last_name: true,
          email: true,
          profile_picture_url: true },
      },
      meetingHosts: {
        include: {
          host: { select: { 
            user_id: true, 
            first_name: true,
            last_name: true,
            email: true 
          } },
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
 
  if (!meeting) throw new ApiError(404, "Meeting not found");
 
  return res
    .status(200)
    .json(new ApiResponse(200, meeting, "Meeting details fetched successfully"));
});
 
 
// ─────────────────────────────────────────────
// Get Meeting History  –  GET /meetings
// Query: status, search, from_date, to_date, page, limit
// ─────────────────────────────────────────────
 
const getMeetingHistory = asyncHandler(async (req, res) => {
  // extract the parameter from the req.query
  const { status, search, from_date, to_date, page = 1, limit = 10 } = req.query;
  const host_id = req.user.user_id; // only return the logged-in user's meetings
 
  const pageNum  = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const skip     = (pageNum - 1) * limitNum;
 
  const where = {
    host_id,
    ...(status && { status }),
    ...(search && { meeting_title: { contains: search, mode: "insensitive" } }),
    ...(from_date || to_date
      ? { scheduled_at: { ...(from_date && { gte: new Date(from_date) }), ...(to_date && { lte: new Date(to_date) }) } }
      : {}),
  };
 
  const [meetings, total] = await prisma.$transaction([
    prisma.meeting.findMany({
      where,
      skip,
      take:      limitNum,
      orderBy:   { scheduled_at: "desc" },
      include: {
        host:   { select: { user_id: true, first_name: true, last_name: true, email: true, profile_picture_url: true } },
        _count: { select: { participants: true, recordings: true, files: true } },
      },
    }),
    prisma.meeting.count({ where }),
  ]);
 
  return res.status(200).json(
    new ApiResponse(200, { meetings, meta: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) } }, "Meeting history fetched successfully")
  );
});
 
 
// ─────────────────────────────────────────────
// Delete Meeting  –  DELETE /meetings/:meeting_id
// ─────────────────────────────────────────────
 
const deleteMeeting = asyncHandler(async (req, res) => {
  const { meeting_id } = req.params;
  const requester_id        = req.user.user_id;
 
  const meeting = await prisma.meeting.findUnique({ where: { meeting_id } });
 
  if (!meeting)                         throw new ApiError(404, "Meeting not found");
  if (meeting.host_id !== requester_id) throw new ApiError(403, "Only the host can delete this meeting");
  if (meeting.status === "ongoing")     throw new ApiError(400, "End the meeting before deleting it");
 
  // Delete in FK dependency order so no constraint is violated
  await prisma.$transaction([
    prisma.breakoutRoomParticipant.deleteMany({ where: { breakoutRoom: { meeting_id } } }),
    prisma.breakoutRoom.deleteMany(          { where: { meeting_id } }),
    prisma.participant.deleteMany(           { where: { meeting_id } }),
    prisma.message.deleteMany(              { where: { meeting_id } }),
    prisma.meetingTranscript.deleteMany(    { where: { meeting_id } }),
    prisma.meetingInvite.deleteMany(        { where: { meeting_id } }),
    prisma.recording.deleteMany(            { where: { meeting_id } }),
    prisma.file.deleteMany(                 { where: { meeting_id } }),
    prisma.feedback.deleteMany(             { where: { meeting_id } }),
    prisma.meetingHost.deleteMany(          { where: { meeting_id } }),
    prisma.meeting.delete(                  { where: { meeting_id } }),
  ]);
 
  return res
    .status(200)
    .json(new ApiResponse(200, { meeting_id }, "Meeting deleted successfully"));
});
 
 
// ─────────────────────────────────────────────
// Update Meeting  –  PATCH /meetings/:meeting_id
// ─────────────────────────────────────────────
 
const updateMeeting = asyncHandler(async (req, res) => {
  const { meeting_id }  = req.params;
  const requester_id         = req.user.user_id;
  const { meeting_title, description, scheduled_at, duration_minutes, max_participants, is_recorded, status } = req.body;
 
  const meeting = await prisma.meeting.findUnique({ where: { meeting_id } });
 
  if (!meeting)                         throw new ApiError(404, "Meeting not found");
  if (meeting.host_id !== requester_id) throw new ApiError(403, "Only the host can update this meeting");
  if (meeting.status === "ended")       throw new ApiError(400, "Cannot update an ended meeting");
 
  const updated = await prisma.meeting.update({
    where: { meeting_id },
    data: {
      ...(meeting_title    !== undefined && { meeting_title }),
      ...(description      !== undefined && { description }),
      ...(scheduled_at     !== undefined && { scheduled_at: new Date(scheduled_at) }),
      ...(duration_minutes !== undefined && { duration_minutes }),
      ...(max_participants !== undefined && { max_participants }),
      ...(is_recorded      !== undefined && { is_recorded }),
      ...(status           !== undefined && { status }),
    },
  });
 
  return res
    .status(200)
    .json(new ApiResponse(200, updated, "Meeting updated successfully"));
});
 
 
// ─────────────────────────────────────────────
// Cancel Meeting  –  PATCH /meetings/:id/cancel
// ─────────────────────────────────────────────
 
const cancelMeeting = asyncHandler(async (req, res) => {
  const { meeting_id } = req.params;
  const requester_id        = req.user.user_id;
 
  const meeting = await prisma.meeting.findUnique({ where: { meeting_id } });
 
  if (!meeting)                         throw new ApiError(404, "Meeting not found");
  if (meeting.host_id !== requester_id) throw new ApiError(403, "Only the host can cancel this meeting");
 
  if (["ended", "cancelled"].includes(meeting.status)) {
    throw new ApiError(400, `Meeting is already ${meeting.status}`);
  }
 
  const cancelled = await prisma.meeting.update({
    where: { meeting_id },
    data:  { status: "cancelled" },
  });
 
  return res
    .status(200)
    .json(new ApiResponse(200, { meeting_id, status: cancelled.status }, "Meeting cancelled successfully"));
});
 
 
// ─────────────────────────────────────────────
// Get Meeting Participants  –  GET /meetings/:id/participants
// ─────────────────────────────────────────────
 
const getMeetingParticipants = asyncHandler(async (req, res) => {
  const { meeting_id } = req.params;
 
  const meeting = await prisma.meeting.findUnique({ where: { meeting_id } });
  if (!meeting) throw new ApiError(404, "Meeting not found");
 
  const participants = await prisma.participant.findMany({
    where:   { meeting_id },
    include: {
      user: { select: { user_id: true, first_name: true, last_name: true, email: true, profile_picture_url: true } },
    },
    orderBy: { joined_at: "asc" },
  });
 
  return res
    .status(200)
    .json(new ApiResponse(200, { participants, total: participants.length }, "Participants fetched successfully"));
});
 
 
export {
  createMeeting ,  
  joinMeeting,
  endMeeting,
  getMeetingDetails,
  getMeetingHistory,
  deleteMeeting,
  updateMeeting,
  cancelMeeting,
  getMeetingParticipants,
};
 