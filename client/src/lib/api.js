const API_BASE_URL = "http://localhost:8000/api/v1";

async function fetcher(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;

  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    credentials: "include", // send cookies with cross-origin
  });

  let payload;
  try {
    payload = await res.json();
  } catch {
    payload = { message: "Something went wrong" };
  }

  if (!res.ok) {
    const err = new Error(payload.message || "Request failed");
    err.status = res.status;
    err.data = payload;
    throw err;
  }

  return payload;
}

export async function createMeeting(data) {
  return fetcher("/meeting/create-meeting", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function joinMeeting(data) {
  return fetcher("/meeting/join-meeting", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getMeetings() {
  return fetcher("/meeting/history");
}

export async function scheduleMeeting(data) {
  return fetcher("/meeting/schedule", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getUpcomingMeetings() {
  return fetcher("/meeting/upcoming-meeting");
}

export async function register({ email, password, first_name, last_name }) {
  if (!email || !password || !first_name || !last_name) {
    throw new Error("All fields are required");
  }

  return fetcher("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password, first_name, last_name }),
  });
}

export async function verifyEmailOTP({ email, otp }) {
  if (!email || !otp) {
    throw new Error("Email and verification code are required");
  }

  return fetcher("/auth/verify-otp", {
    method: "POST",
    body: JSON.stringify({ email, otp }),
  });
}

export async function resendEmailOTP({ email }) {
  if (!email) {
    throw new Error("Email is required");
  }

  return fetcher("/auth/resend-otp", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function login(data) {
  return fetcher("/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email: data.identifier,
      password: data.password,
    }),
  });
}

export async function getProfile() {
  return fetcher("/profile/me");
}

export async function getMeetingDetails(meetingId) {
  return fetcher(`/meeting/${meetingId}`);
}

export async function updateMeeting(meetingId, data) {
  return fetcher(`/meeting/${meetingId}/update`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteMeeting(meetingId) {
  return fetcher(`/meeting/${meetingId}/delete`, {
    method: "DELETE",
  });
}

export async function enterLobby(meetingId) {
  return fetcher(`/room/meetings/${meetingId}/lobby/enter`, {
    method: "POST",
  });
}

export async function admitParticipant(meetingId, participantId) {
  return fetcher(`/room/meetings/${meetingId}/lobby/${participantId}/admit`, {
    method: "PATCH",
  });
}

export async function denyParticipant(meetingId, participantId) {
  return fetcher(`/room/meetings/${meetingId}/lobby/${participantId}/deny`, {
    method: "PATCH",
  });
}

export async function setLobbyDisplayName(meetingId, displayName) {
  return fetcher(`/room/meetings/${meetingId}/lobby/display-name`, {
    method: "PATCH",
    body: JSON.stringify({ display_name: displayName }),
  });
}

export async function sendEmailInvite(meetingId, emails, message = "") {
  return fetcher(`/meeting/${meetingId}/invite-email`, {
    method: "POST",
    body: JSON.stringify({ emails, message }),
  });
}

export async function generateInviteLink(meetingId, expiresInHours = 24) {
  return fetcher(`/meeting/${meetingId}/invite-link`, {
    method: "POST",
    body: JSON.stringify({ expires_in_hours: expiresInHours }),
  });
}

export async function getMeetingParticipants(meetingId) {
  return fetcher(`/meeting/${meetingId}/participants`);
}

export async function cancelMeeting(meetingId, reason = "") {
  return fetcher(`/meeting/${meetingId}/cancel`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

export async function endMeeting(meetingId) {
  return fetcher(`/meeting/${meetingId}/end`, {
    method: "PATCH",
  });
}

export async function updateSchedule(meetingId, data) {
  return fetcher(`/meeting/${meetingId}/schedule-meeting/update`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export default fetcher;

