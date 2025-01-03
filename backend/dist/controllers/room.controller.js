"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const room_service_1 = require("../services/room.service");
dotenv_1.default.config();
class RoomController {
    constructor() {
        this.createRoom = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const code = generateRoomCode();
                const creatorId = req.userId;
                const roomData = Object.assign(Object.assign({}, req.body), { code,
                    creatorId });
                const room = yield (0, room_service_1.createRoom)(roomData);
                return res.status(201).json(room);
            }
            catch (error) {
                return res.status(500).json({ error: "Failed to create room" });
            }
        });
        this.joinRoom = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                if (!req.body.code) {
                    return res.status(400).json({ error: "No room code" });
                }
                const roomExists = yield (0, room_service_1.validRoomCode)(req.body.code);
                if (!roomExists) {
                    return res.status(400).json({ error: "Invalid room code" });
                }
                const userId = req.userId;
                const roomId = roomExists.id;
                const roomData = {
                    userId,
                    roomId
                };
                const roomResponse = yield (0, room_service_1.joinRoom)(roomData);
                return res.status(201).json(roomResponse);
            }
            catch (error) {
                return res.status(500).json({ error: "Failed to join room" });
            }
        });
    }
}
exports.default = RoomController;
function generateRoomCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}
