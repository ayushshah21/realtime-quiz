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



export default router;
