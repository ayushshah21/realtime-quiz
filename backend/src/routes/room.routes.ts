import { Router, Request, Response } from "express"; // Ensure proper imports
import passport from "../config/passport";
import * as authController from "../controllers/auth.controller";
import { authGuard } from "../middlewares/auth.middleware";
import { validRoomName } from "../middlewares/room.middleware";
import RoomController from "../controllers/room.controller";

const router = Router();
const roomController = new RoomController();

router.post('/create', authGuard, validRoomName, (req: Request, res: Response) => {
    roomController.createRoom(req, res);
})

router.post('/join', authGuard, (req: Request, res: Response) => {
    roomController.joinRoom(req, res);
})

router.post('/:roomId/start', authGuard, (req: Request, res: Response) => {
    roomController.startQuiz(req, res);
});

router.get('/:roomId', authGuard, (req: Request, res: Response) => {
    roomController.getRoomDetails(req, res);
});



export default router;
