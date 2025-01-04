// import EventModel from '../models/eventModel';
import { NextFunction, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv'
import { createRoom, validRoomCode, joinRoom } from '../services/room.service';
import { PrismaClient } from '@prisma/client';
import { ActiveQuizState, QuizQuestion } from '../types/types';

const prisma = new PrismaClient();

dotenv.config();

const activeQuizzes = new Map<string, ActiveQuizState>();

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
            if (!req.body.code) {
                return res.status(400).json({ error: "No room code" });
            }
            const roomExists = await validRoomCode(req.body.code);
            if (!roomExists) {
                return res.status(400).json({ error: "Invalid room code" });
            }
            const userId = (req as any).userId;
            const roomId = roomExists.id;
            const roomData = {
                userId,
                roomId
            }
            const roomResponse = await joinRoom(roomData);
            return res.status(200).json(roomResponse);
        }
        catch (error) {
            return res.status(500).json({ error: "Failed to join room" });
        }
    }

    startQuiz = async (req: Request, res: Response) => {
        try {
            const { roomId } = req.params;
            const userId = (req as any).userId;

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
            const io = req.app.get('io');
            io.to(roomId).emit('quizStarted', {
                roomId,
                firstQuestion: room.quiz.questions[0]
            });

            return res.status(200).json(updatedRoom);
        } catch (error) {
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