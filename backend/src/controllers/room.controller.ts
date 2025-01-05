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
            const { code } = req.body;
            const userId = (req as any).userId;

            const room = await validRoomCode(code);
            if (!room) {
                return res.status(404).json({ error: "Room not found" });
            }

            await joinRoom({ userId, roomId: room.id });

            // Get updated room data with participants
            const updatedRoom = await prisma.room.findUnique({
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

            const io = getIO();
            // Make sure clients are in the room before emitting
            const sockets = await io.in(room.id).fetchSockets();
            console.log(`Number of clients in room ${room.id}:`, sockets.length);

            io.to(room.id).emit('participantJoined', updatedRoom);

            return res.status(200).json({ roomId: room.id });
        } catch (error) {
            console.error('Error joining room:', error);
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

    getRoomDetails = async (req: Request, res: Response) => {
        try {
            console.log("IN HERE");
            const { roomId } = req.params;
            const userId = (req as any).userId;

            const room = await prisma.room.findUnique({
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
        } catch (error) {
            console.error('Error fetching room details:', error);
            return res.status(500).json({ error: "Failed to fetch room details" });
        }
    };

}


function generateRoomCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}