import { NextFunction, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv'
import { createRoom, validRoomCode, joinRoom } from '../services/room.service';
import { PrismaClient } from '@prisma/client';
import { ActiveQuizState, QuizQuestion } from '../types/types';
import { activeQuizzes } from '../state/quizState';
import { getIO } from '../websockets/socketManager';

const prisma = new PrismaClient();

dotenv.config();

export default class RoomController {
    createRoom = async (req: Request, res: Response) => {
        try {
            const code = generateRoomCode();
            const creatorId = (req as any).userId;
            const roomData = {
                ...req.body,
                code,
                creatorId
            }
            const room = await createRoom(roomData);
            return res.status(201).json(room);
        }
        catch (error) {
            return res.status(500).json({ error: "Failed to create room" });
        }
    }
    joinRoom = async (req: Request, res: Response) => {
        try {
            console.log("Join room request:", req.body.code);
            if (!req.body.code) {
                return res.status(400).json({ error: "No room code" });
            }

            const roomExists = await validRoomCode(req.body.code);
            console.log("Room exists:", roomExists);

            if (!roomExists) {
                return res.status(400).json({ error: "Invalid room code" });
            }

            const userId = (req as any).userId;
            const roomId = roomExists.id;
            console.log("Attempting to join room:", { userId, roomId });

            const roomData = {
                userId,
                roomId
            }

            const roomResponse = await joinRoom(roomData);
            console.log("Join room response:", roomResponse);

            return res.status(200).json(roomResponse);
        }
        catch (error) {
            console.error("Join room error:", error);
            return res.status(500).json({ error: "Failed to join room" });
        }
    }

    startQuiz = async (req: Request, res: Response) => {
        try {
            const { roomId } = req.params;
            const userId = (req as any).userId;

            // Reset scores for this room before starting
            await prisma.score.deleteMany({
                where: {
                    participant: {
                        roomId: roomId
                    }
                }
            });

            const room = await prisma.room.findUnique({
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
            activeQuizzes.set(roomId, {
                currentQuestionIndex: 0,
                questions: room.quiz.questions,
                timer: null
            });

            const updatedRoom = await prisma.room.update({
                where: { id: roomId },
                data: {
                    status: "IN_PROGRESS",
                    startedAt: new Date()
                }
            });

            // Emit to clients only
            const io = getIO();
            io.to(roomId).emit('quizStarted', {
                roomId,
                firstQuestion: room.quiz.questions[0]
            });

            // Also emit the first question
            io.to(roomId).emit('new_question', room.quiz.questions[0]);

            return res.status(200).json(updatedRoom);
        } catch (error) {
            console.error('Error starting quiz:', error);
            return res.status(500).json({ error: "Failed to start quiz" });
        }
    }

}


function generateRoomCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}