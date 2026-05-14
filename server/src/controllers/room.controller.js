import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError }     from "../utils/ApiError.js";
import { ApiResponse }  from "../utils/ApiResponse.js";
import prisma           from "../db/index.js";

// -------------------------
//      Lobby Controllers


// ─────────────────────────────────────────────
// enterLobby
// POST /meetings/:meeting_id/lobby/enter
// Participant enters the pre-join waiting room
// ─────────────────────────────────────────────
const enterLobby = asyncHandler(async (req, res) => {
  const { meeting_id } = req.params;
  const participant_id = req.user?.user_id;

  if (!participant_id)
    throw new ApiError(401, "Unauthorized. Please log in.");

  // ── Fetch meeting ──────────────────────────
  const meeting = await prisma.meeting.findUnique({
    where: { meeting_id },
  });

  if (!meeting)
    throw new ApiError(404, "Meeting not found.");

  // ── Status guards ──────────────────────────
  if (meeting.status === "ended" || meeting.status === "cancelled")
    throw new ApiError(400, "This meeting has ended or been cancelled.");

  if (meeting.status !== "scheduled" && meeting.status !== "ongoing")
    throw new ApiError(400, "Meeting is not accepting participants at this time.");

  // ── Host guard ─────────────────────────────
  if (meeting.host_id === participant_id)
    throw new ApiError(400, "Host cannot enter their own lobby.");

  // ── Check if already admitted ──────────────
  // Prevent re-entering lobby if already inside the meeting
  const existingLobby = await prisma.meetingLobby.findUnique({
    where: {
      meeting_id_participant_id: { meeting_id, participant_id },
    },
  });

  if (existingLobby?.status === "admitted")
    throw new ApiError(400, "You are already admitted to this meeting.");

  // ── Upsert lobby entry ─────────────────────
  const lobbyEntry = await prisma.meetingLobby.upsert({
    where: {
      meeting_id_participant_id: { meeting_id, participant_id },
    },
    update: {
      status:     "waiting",
      entered_at: new Date(),
      denied_at:  null,
      admitted_at: null,
    },
    create: {
      meeting_id,
      participant_id,
      status:     "waiting",
      entered_at: new Date(),
    },
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      { lobby: lobbyEntry },
      "You have entered the lobby. Waiting for the host to admit you."
    )
  );
});


// ─────────────────────────────────────────────
// admitParticipant
// PATCH /meetings/:meeting_id/lobby/:participant_id/admit
// Host admits a waiting participant into the meeting
//
// NOTE: :participant_id in the URL is always User.user_id
// NOT Participant.participant_id (the Participant table's PK)
// ─────────────────────────────────────────────
const admitParticipant = asyncHandler(async (req, res) => {
  const { meeting_id }   = req.params;
  let   { participant_id } = req.params; // User.user_id of the person being admitted
  const requester_id     = req.user?.user_id;

  if (!requester_id)
    throw new ApiError(401, "Unauthorized. Please log in.");

  // ── Fetch meeting ──────────────────────────
  const meeting = await prisma.meeting.findUnique({
    where: { meeting_id },
  });

  if (!meeting)
    throw new ApiError(404, "Meeting not found.");

  // ── Host guard ─────────────────────────────
  if (meeting.host_id !== requester_id)
    throw new ApiError(403, "Only the host can admit participants.");

  // ── Status guard ───────────────────────────
  if (meeting.status === "ended" || meeting.status === "cancelled")
    throw new ApiError(400, "Cannot admit participants to a meeting that has ended or been cancelled.");

  // ── Resolve participant_id → User.user_id ──

  let lobbyEntry = await prisma.meetingLobby.findUnique({
    where: {
      meeting_id_participant_id: { meeting_id, participant_id },
    },
  });

  if (!lobbyEntry) {
    // Attempt to resolve as Participant.participant_id → user_id
    const participantRow = await prisma.participant.findUnique({
      where:  { participant_id },
      select: { user_id: true, meeting_id: true },
    });

    // Only resolve if it belongs to this meeting
    if (participantRow && participantRow.meeting_id === meeting_id) {
      participant_id = participantRow.user_id;

      // Re-fetch lobby with resolved user_id
      lobbyEntry = await prisma.meetingLobby.findUnique({
        where: {
          meeting_id_participant_id: { meeting_id, participant_id },
        },
      });
    }
  }

  // ── Lobby guard ────────────────────────────
  if (!lobbyEntry)
    throw new ApiError(404, "Participant has not entered the lobby yet.");

  if (lobbyEntry.status === "admitted")
    throw new ApiError(400, "Participant has already been admitted.");

  if (lobbyEntry.status === "denied")
    throw new ApiError(400, "Participant was denied entry. They must re-enter the lobby.");

  // ── Admit: update lobby + sync Participant row ─────────────────
  const existingParticipant = await prisma.participant.findFirst({
    where: { meeting_id, user_id: participant_id },
  });

  const updatedLobby = await prisma.$transaction(async (tx) => {
    // 1. Mark lobby as admitted
    const lobby = await tx.meetingLobby.update({
      where: {
        meeting_id_participant_id: { meeting_id, participant_id },
      },
      data: {
        status:      "admitted",
        admitted_at: new Date(),
      },
    });

    // 2. Add to Participants table (or update if re-joining)
    if (!existingParticipant) {
      await tx.participant.create({
        data: {
          meeting_id,
          user_id:     participant_id,
          joined_at:   new Date(),
          is_host:     false,
          is_muted:    false,
          is_video_on: true,
        },
      });
    } else {
      await tx.participant.update({
        where: { participant_id: existingParticipant.participant_id },
        data:  { joined_at: new Date(), left_at: null },
      });
    }

    return lobby;
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      { lobby: updatedLobby },
      "Participant has been admitted to the meeting."
    )
  );
});

// ─────────────────────────────────────────────
// denyParticipant
// PATCH /meetings/:meeting_id/lobby/:participant_id/deny
// Host rejects a waiting participant from the lobby
// ─────────────────────────────────────────────

const denyParticipant = asyncHandler(async (req , res) => {
    // retrive data from params
    const { meeting_id } = req.params;
    let {   participant_id } = req.params;
    // retrive from jwt middleware
    const requester_id = req.user.user_id;
    if(!requester_id)
        throw new ApiError(400 , "Unauthorized User.")

    // fetch Meeting
    const meeting = await prisma.meeting.findUnique({
        where : {   meeting_id  }
    })
    // Check meeting exists or not
    if(!meeting)
        throw new ApiError(404 , "Meeting not Found.")

    if(meeting.host_id !== requester_id)
        throw new ApiError(400 , "Only Host can denyb the participant to entered to lobby.")

    if(meeting.status === 'ended' || meeting.status === 'cancelled')
        throw new ApiError(400 , "Cannot deny participants for a meeting thatb has ended or been cancelled.")

    let lobbyEntry = await prisma.meetingLobby.findUnique({
        where : {
            meeting_id_participant_id : {  meeting_id , participant_id  }
        }
    })

    if (!lobbyEntry) {
    const participantRow = await prisma.participant.findUnique({
      where:  { participant_id },
      select: { user_id: true, meeting_id: true },
    });


        if (participantRow && participantRow.meeting_id === meeting_id) {
      participant_id = participantRow.user_id;
      lobbyEntry     = await prisma.meetingLobby.findUnique({
        where: {
          meeting_id_participant_id: { meeting_id, participant_id },
        },
      });
    }
  }

   if (!lobbyEntry)
    throw new ApiError(404, "Participant has not entered the lobby yet.");

  if (lobbyEntry.status === "denied")
    throw new ApiError(400, "Participant has already been denied.");

  if (lobbyEntry.status === "admitted")
    throw new ApiError(400, "Participant is already admitted to the meeting.");

  // ── Deny ───────────────────────────────────
  const updatedLobby = await prisma.meetingLobby.update({
    where: {
      meeting_id_participant_id: { meeting_id, participant_id },
    },
    data: {
      status:    "denied",
      denied_at: new Date(),
    },
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      { lobby: updatedLobby },
      "Participant has been denied entry to the meeting."
    )
  );

})



// ─────────────────────────────────────────────
// setDisplayName
// PATCH /meetings/:meeting_id/lobby/display-name
// Participant sets their display name before joining
// ─────────────────────────────────────────────
const setDisplayName = asyncHandler(async (req, res) => {
  const { meeting_id }   = req.params;
  const participant_id   = req.user?.user_id;
  const { display_name } = req.body;

  if (!participant_id)
    throw new ApiError(401, "Unauthorized. Please log in.");

  // ── Validate input ─────────────────────────
  if (!display_name || typeof display_name !== "string" || !display_name.trim())
    throw new ApiError(400, "display_name is required and must be a non-empty string.");

  const trimmedName = display_name.trim();

  if (trimmedName.length > 50)
    throw new ApiError(400, "display_name must not exceed 50 characters.");

  // ── Fetch meeting ──────────────────────────
  const meeting = await prisma.meeting.findUnique({
    where: { meeting_id },
  });

  if (!meeting)
    throw new ApiError(404, "Meeting not found.");

  if (meeting.status === "ended" || meeting.status === "cancelled")
    throw new ApiError(400, "Cannot set display name for a meeting that has ended or been cancelled.");

  if (meeting.host_id === participant_id)
    throw new ApiError(400, "Host does not need to set a display name in the lobby.");

  // ── Upsert lobby with display name ─────────
  const lobbyEntry = await prisma.meetingLobby.upsert({
    where: {
      meeting_id_participant_id: { meeting_id, participant_id },
    },
    update:  { display_name: trimmedName },
    create: {
      meeting_id,
      participant_id,
      display_name: trimmedName,
      status:       "waiting",
      entered_at:   new Date(),
    },
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      { display_name: lobbyEntry.display_name },
      "Display name set successfully."
    )
  );
});

// -------------------------




export {
  enterLobby ,
  admitParticipant ,
  denyParticipant ,
  setDisplayName ,
};