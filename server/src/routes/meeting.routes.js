import { Router } from "express";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { addCoHost, cancelMeeting, createMeeting, deleteMeeting, endMeeting, generateInviteLink, getMeetingDetails, getMeetingHistory, getMeetingParticipants, getUpcomingMeetings, joinMeeting, removeParticipant, scheduleMeeting, sendEmailInvite, syncCalendarInvite, updateMeeting, updateSchedule } from "../controllers/meeting.controller.js";
const router = Router()

router.route('/create-meeting')     .post(verifyJWT , createMeeting)
router.route('/schedule')           .post(verifyJWT , scheduleMeeting)
router.route('/join-meeting')       .post(verifyJWT , joinMeeting)
router.route('/history')            .get(verifyJWT, getMeetingHistory)
router.route('/upcoming-meeting')   .get(verifyJWT , getUpcomingMeetings)

router.route('/:meeting_id')        .get(verifyJWT , getMeetingDetails)
router.route('/:meeting_id/add-co-host')        .post(verifyJWT , addCoHost)
router.route('/:meeting_id/invite-link').post(verifyJWT, generateInviteLink);
router.route('/:meeting_id/invite-email').post(verifyJWT, sendEmailInvite);
router.route('/:meeting_id/participants') .get(verifyJWT , getMeetingParticipants)
router.route('/:meeting_id/participants/:user_id/remove') .delete(verifyJWT , removeParticipant)
router.route('/:meeting_id/update') .patch(verifyJWT , updateMeeting)
router.route('/:meeting_id/cancel').post(verifyJWT , cancelMeeting)
router.route('/:meeting_id/end')    .patch(verifyJWT , endMeeting)
router.route('/:meeting_id/delete') .delete(verifyJWT , deleteMeeting)
router.route("/:meeting_id/schedule-meeting/update").patch(verifyJWT , updateSchedule)
router.route('/:meeting_id/calendar').get(verifyJWT, syncCalendarInvite);


export default router