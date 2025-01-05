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
                    return res.status(404).json({ error: "Room not found" });
                }
                // Reset scores for this room
                yield prisma.score.deleteMany({
                    where: {
                        participant: {
                            roomId: roomId
                        }
                    }
                });
                // Initialize quiz state
                const quizState = {
                    currentQuestionIndex: 0,
                    questions: room.quiz.questions,
                    timer: null,
                    answeredUserIds: new Set()
                };
                quizState_1.activeQuizzes.set(roomId, quizState);
                const io = (0, socketManager_1.getIO)();
                // Check if room exists in socket
                const sockets = yield io.in(roomId).fetchSockets();
                if (sockets.length === 0) {
                    return res.status(400).json({ error: "No participants connected" });
                }
                // Emit first question immediately
                io.to(roomId).emit('quizStarted', { message: 'Quiz is starting' });
                setTimeout(() => {
                    io.to(roomId).emit('new_question', Object.assign(Object.assign({}, quizState.questions[0]), { startTime: Date.now(), timeLimit: quizState.questions[0].timeLimit || 30 }));
                    this.startQuestionTimer(roomId, quizState.questions[0].timeLimit || 30);
                }, 3000);
                const updatedRoom = yield prisma.room.update({
                    where: { id: roomId },
                    data: {
                        status: "IN_PROGRESS",
                        startedAt: new Date()
                    }
                });
                return res.json(updatedRoom);
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
    startQuestionTimer(roomId, timeLimit) {
        const quizState = quizState_1.activeQuizzes.get(roomId);
        if (!quizState)
            return;
        if (quizState.timer) {
            clearInterval(quizState.timer);
        }
        const startTime = Date.now();
        let previousTimeRemaining = timeLimit;
        const io = (0, socketManager_1.getIO)();
        const intervalId = setInterval(() => {
            const timeElapsed = Math.floor((Date.now() - startTime) / 1000);
            const timeRemaining = timeLimit - timeElapsed;
            if (timeRemaining !== previousTimeRemaining) {
                io.to(roomId).emit('time_update', {
                    timeRemaining,
                    questionIndex: quizState.currentQuestionIndex
                });
                previousTimeRemaining = timeRemaining;
            }
            if (timeRemaining <= 0) {
                clearInterval(intervalId);
                quizState.timer = null;
                // Only emit timeout if this is still the current question
                if (quizState.currentQuestionIndex === quizState.questions.length - 1) {
                    io.to(roomId).emit('quiz_ended', {
                        message: 'Quiz completed',
                        totalQuestions: quizState.questions.length
                    });
                }
                else {
                    io.to(roomId).emit('question_timeout', { roomId });
                }
            }
        }, 100);
        quizState.timer = intervalId;
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
