import { NextFunction, Request, Response } from 'express';
import { createQuiz } from '../services/quiz.service';


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
}