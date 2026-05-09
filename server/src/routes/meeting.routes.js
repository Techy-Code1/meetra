import { Router } from "express";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { cancelMeeting, createMeeting, deleteMeeting, endMeeting, getMeetingDetails, getMeetingHistory, getMeetingParticipants, joinMeeting, updateMeeting } from "../controllers/meeting.controller.js";
const router = Router()

router.route('/create-meeting')     .post(verifyJWT , createMeeting)
router.route('/join-meeting')       .post(verifyJWT , joinMeeting)
router.route('/history')            .get(verifyJWT, getMeetingHistory)

router.route('/:meeting_id')        .get(verifyJWT , getMeetingDetails)
router.route('/:meeting_id/participants') .get(verifyJWT , getMeetingParticipants)
router.route('/:meeting_id/update') .patch(verifyJWT , updateMeeting)
router.route('/:meeting_id/cancel').post(verifyJWT , cancelMeeting)
router.route('/:meeting_id/end')    .patch(verifyJWT , endMeeting)
router.route('/:meeting_id/delete') .delete(verifyJWT , deleteMeeting)



export default router