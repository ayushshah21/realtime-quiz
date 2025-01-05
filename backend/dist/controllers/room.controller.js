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
const client_1 = require("@prisma/client");
const quizState_1 = require("../state/quizState");
const socketManager_1 = require("../websockets/socketManager");
const prisma = new client_1.PrismaClient();
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
                const { code } = req.body;
                const userId = req.userId;
                const room = yield (0, room_service_1.validRoomCode)(code);
                if (!room) {
                    return res.status(404).json({ error: "Room not found" });
                }
                yield (0, room_service_1.joinRoom)({ userId, roomId: room.id });
                // Get updated room data with participants
                const updatedRoom = yield prisma.room.findUnique({
                    where: { id: room.id },
                    include: {
                        quiz: { select: { title: true } },
                        participants: {
                            include: {
                                user: { select: { email: true } }
                            }
                        }
                    }
                });
                // Add console.log to debug
                console.log('Emitting participantJoined event:', updatedRoom);
                const io = (0, socketManager_1.getIO)();
                // Make sure clients are in the room before emitting
                const sockets = yield io.in(room.id).fetchSockets();
                console.log(`Number of clients in room ${room.id}:`, sockets.length);
                io.to(room.id).emit('participantJoined', updatedRoom);
                return res.status(200).json({ roomId: room.id });
            }
            catch (error) {
                console.error('Error joining room:', error);
                return res.status(500).json({ error: "Failed to join room" });
            }
        });
        this.startQuiz = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { roomId } = req.params;
                const userId = req.userId;
                // Reset scores for this room before starting
                yield prisma.score.deleteMany({
                    where: {
                        participant: {
                            roomId: roomId
                        }
                    }
                });
                const room = yield prisma.room.findUnique({
                    where: { id: roomId },
                    include: {
                        quiz: {
                            include: {
                                questions: {
                                    orderBy: {
                                        order: 'asc'
                                    }
                                }
                            }
                        }
                    }
                });
                if (!room) {
                    return res.status(403).json({ error: "Not authorized to start this quiz" });
                }
                // Initialize quiz state
                quizState_1.activeQuizzes.set(roomId, {
                    currentQuestionIndex: 0,
                    questions: room.quiz.questions,
                    timer: null
                });
                const updatedRoom = yield prisma.room.update({
                    where: { id: roomId },
                    data: {
                        status: "IN_PROGRESS",
                        startedAt: new Date()
                    }
                });
                // Emit to clients only
                const io = (0, socketManager_1.getIO)();
                io.to(roomId).emit('quizStarted', {
                    roomId,
                    firstQuestion: room.quiz.questions[0]
                });
                // Also emit the first question
                io.to(roomId).emit('new_question', room.quiz.questions[0]);
                return res.status(200).json(updatedRoom);
            }
            catch (error) {
                console.error('Error starting quiz:', error);
                return res.status(500).json({ error: "Failed to start quiz" });
            }
        });
        this.getRoomDetails = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                console.log("IN HERE");
                const { roomId } = req.params;
                const userId = req.userId;
                const room = yield prisma.room.findUnique({
                    where: { id: roomId },
                    include: {
                        quiz: {
                            select: {
                                title: true,
                            }
                        },
                        participants: {
                            include: {
                                user: {
                                    select: {
                                        email: true
                                    }
                                }
                            }
                        }
                    }
                });
                if (!room) {
                    return res.status(404).json({ error: "Room not found" });
                }
                return res.status(200).json(room);
            }
            catch (error) {
                console.error('Error fetching room details:', error);
                return res.status(500).json({ error: "Failed to fetch room details" });
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
