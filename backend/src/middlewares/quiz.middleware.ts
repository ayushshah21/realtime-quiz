import z from 'zod';
import express, { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';

// Define the question schema
const questionSchema = z.object({
    text: z.string().min(1, "Question text is required"),
    options: z.array(z.string()).min(2, "At least 2 options are required"),
    correctAnswer: z.number().min(0).max(3, "Correct answer must be a valid option index"),
    timeLimit: z.number().min(10).max(300).optional(), // 10 seconds to 5 minutes
    points: z.number().min(0).max(1000).optional()
});

// Define the quiz schema
const newQuizSchema = z.object({
    title: z.string().min(1, "Quiz title is required"),
    description: z.string().optional(),
    questions: z.array(questionSchema)
        .min(1, "Quiz must have at least one question")
        .max(50, "Quiz cannot have more than 50 questions")
});

export async function validQuizFormat(req: Request, res: Response, next: NextFunction){
    const validateBody = newQuizSchema.safeParse(req.body);
    if(!validateBody.success){
        res.status(404).json({msg: "Invalid Quiz body"});
        return;
    }
    next();
}
