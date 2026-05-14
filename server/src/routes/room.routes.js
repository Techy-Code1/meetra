import { Router } from 'express';
import { admitParticipant, denyParticipant, enterLobby, setDisplayName } from '../controllers/room.controller.js';
import { verifyJWT } from '../middleware/auth.middleware.js';

const router = Router();

router.route('/meetings/:meeting_id/lobby/enter').post(verifyJWT , enterLobby)
router.route("/meetings/:meeting_id/lobby/:participant_id/admit").patch(verifyJWT , admitParticipant)
router.route('/meetings/:meeting_id/lobby/:participant_id/deny').patch(verifyJWT , denyParticipant)
router.route("/meetings/:meeting_id/lobby/display-name").patch(verifyJWT , setDisplayName)
export default router;