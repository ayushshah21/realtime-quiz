import { NextFunction, Request, Response } from 'express';
import { createQuiz } from '../services/quiz.service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default class QuizController {
    createQuiz = async (req: Request, res: Response) => {
        try {
            const creatorId = (req as any).userId;
            const quizData = {
                ...req.body,
                creatorId
            };
            const quiz = await createQuiz(quizData);
            return res.status(201).json(quiz);
        }
        catch (error) {
            return res.status(500).json({ error: "Failed to create quiz" });
        }

    }

    getUserQuizzes = async (req: Request, res: Response) => {
        try {
            const userId = (req as any).userId;
            const quizzes = await prisma.quiz.findMany({
                where: {
                    creatorId: userId
                },
                select: {
                    id: true,
                    title: true,
                    description: true,
                    createdAt: true
                },
                orderBy: {
                    createdAt: 'desc'
                }
            });

            return res.status(200).json(quizzes);
        } catch (error) {
            console.error('Error fetching quizzes:', error);
            return res.status(500).json({ error: "Failed to fetch quizzes" });
        }
    }
}