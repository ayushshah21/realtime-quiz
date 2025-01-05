"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express"); // Ensure proper imports
const auth_middleware_1 = require("../middlewares/auth.middleware");
const room_middleware_1 = require("../middlewares/room.middleware");
const room_controller_1 = __importDefault(require("../controllers/room.controller"));
const router = (0, express_1.Router)();
const roomController = new room_controller_1.default();
router.post('/create', auth_middleware_1.authGuard, room_middleware_1.validRoomName, (req, res) => {
    roomController.createRoom(req, res);
});
router.post('/join', auth_middleware_1.authGuard, (req, res) => {
    roomController.joinRoom(req, res);
});
router.post('/:roomId/start', auth_middleware_1.authGuard, (req, res) => {
    roomController.startQuiz(req, res);
});
router.get('/:roomId', auth_middleware_1.authGuard, (req, res) => {
    roomController.getRoomDetails(req, res);
});
exports.default = router;
