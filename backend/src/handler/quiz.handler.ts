import { Server, Socket } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import { ActiveQuizState } from '../types/types';

const prisma = new PrismaClient();
const activeQuizzes = new Map<string, ActiveQuizState>();

export function handleQuizEvents(io: Server, socket: Socket) {
    // Add function to move to next question
    function moveToNextQuestion(roomId: string) {
        const quizState = activeQuizzes.get(roomId);
        if (!quizState) return;

        quizState.currentQuestionIndex++;

        // Check if quiz is finished
        if (quizState.currentQuestionIndex >= quizState.questions.length) {
            io.to(roomId).emit('quiz_ended');
            activeQuizzes.delete(roomId);
            return;
        }

        // Send next question
        const nextQuestion = quizState.questions[quizState.currentQuestionIndex];
        io.to(roomId).emit('new_question', nextQuestion);
    }

    // Modify submitAnswer to call moveToNextQuestion
    socket.on('submitAnswer', async ({ roomId, userId, answer }) => {
        const quizState = activeQuizzes.get(roomId);
        if (!quizState) return;

        const currentQuestion = quizState.questions[quizState.currentQuestionIndex];
        const isCorrect = currentQuestion.correctAnswer === answer;

        // Get participant first
        const participant = await prisma.roomParticipant.findUnique({
            where: {
                userId_roomId: {
                    userId,
                    roomId
                }
            }
        });

        if (!participant) return;

        // Save answer to database
        await prisma.score.create({
            data: {
                score: isCorrect ? currentQuestion.points : 0,
                user: {
                    connect: { id: userId }
                },
                participant: {
                    connect: { id: participant.id }
                }
            }
        });

        // Send result back to the user
        socket.emit('answer_result', {
            correct: isCorrect,
            correctAnswer: currentQuestion.correctAnswer,
            points: isCorrect ? currentQuestion.points : 0
        });

        // After sending result, move to next question after a delay
        setTimeout(() => moveToNextQuestion(roomId), 3000); // 3 second delay
    });

    // Add join room handler
    socket.on('join_room', ({ roomId }) => {
        socket.join(roomId);
        console.log(`User joined room: ${roomId}`);
    });
}