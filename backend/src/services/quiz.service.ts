import { Server, Socket } from 'socket.io';
import * as http from 'http';
import { PrismaClient } from "@prisma/client";
import { CreateQuizInput } from '../types/types';

const prisma = new PrismaClient();

   // POST /api/quizzes
   export async function createQuiz({title, description, creatorId, questions}: CreateQuizInput) {
    return await prisma.quiz.create({
        data: {
            title,
            description,
            creatorId,
            questions: {
                create: questions.map((question, index) => ({
                    text: question.text,
                    options: question.options,
                    correctAnswer: question.correctAnswer,
                    order: index + 1,
                    timeLimit: question.timeLimit || 30,
                    points: question.points || 100
                }))
            }
        },
        include: {
            questions: true // Include questions in the response
        }
    });
}