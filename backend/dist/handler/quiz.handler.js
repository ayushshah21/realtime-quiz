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
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleQuizEvents = handleQuizEvents;
const client_1 = require("@prisma/client");
const quizState_1 = require("../state/quizState");
const prisma = new client_1.PrismaClient();
function handleQuizEvents(io, socket) {
    // Add join room handler
    socket.on('join_room', ({ roomId }) => {
        socket.join(roomId);
        console.log(`User joined room: ${roomId}`);
    });
    // Add function to move to next question
    function moveToNextQuestion(roomId) {
        const quizState = quizState_1.activeQuizzes.get(roomId);
        if (!quizState) {
            console.log('No quiz state found for room:', roomId);
            return;
        }
        console.log('Moving to next question. Current index:', quizState.currentQuestionIndex);
        quizState.currentQuestionIndex++;
        // Check if quiz is finished
        if (quizState.currentQuestionIndex >= quizState.questions.length) {
            console.log('Quiz ended');
            io.to(roomId).emit('quiz_ended', {
                message: 'Quiz completed',
                totalQuestions: quizState.questions.length
            });
            quizState_1.activeQuizzes.delete(roomId);
            return;
        }
        // Send next question
        const nextQuestion = quizState.questions[quizState.currentQuestionIndex];
        console.log('Sending next question:', nextQuestion);
        io.to(roomId).emit('new_question', nextQuestion);
    }
    // Modify submitAnswer to call moveToNextQuestion
    socket.on('submitAnswer', (_a) => __awaiter(this, [_a], void 0, function* ({ roomId, userId, answer }) {
        try {
            console.log('Received answer:', { roomId, userId, answer });
            const quizState = quizState_1.activeQuizzes.get(roomId);
            if (!quizState) {
                console.log('No quiz state found for room:', roomId);
                return;
            }
            console.log('Current quiz state:', {
                currentQuestionIndex: quizState.currentQuestionIndex,
                totalQuestions: quizState.questions.length
            });
            const currentQuestion = quizState.questions[quizState.currentQuestionIndex];
            const isCorrect = currentQuestion.correctAnswer === answer;
            console.log('Answer check:', { isCorrect, expected: currentQuestion.correctAnswer, received: answer });
            console.log(userId + "\n" + roomId);
            // Get participant first
            const participant = yield prisma.roomParticipant.findUnique({
                where: {
                    userId_roomId: {
                        userId,
                        roomId
                    }
                }
            });
            if (!participant) {
                console.log('No participant found');
                return;
            }
            // Save or update score in database
            yield prisma.score.upsert({
                where: {
                    participantId: participant.id
                },
                create: {
                    score: isCorrect ? currentQuestion.points : 0,
                    participantId: participant.id,
                    userId: userId,
                    answeredCount: 1,
                    correctCount: isCorrect ? 1 : 0
                },
                update: {
                    score: {
                        increment: isCorrect ? currentQuestion.points : 0
                    },
                    answeredCount: {
                        increment: 1
                    },
                    correctCount: {
                        increment: isCorrect ? 1 : 0
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
            console.log('Setting timeout for next question');
            setTimeout(() => {
                console.log('Timeout triggered, moving to next question');
                moveToNextQuestion(roomId);
            }, 3000);
        }
        catch (error) {
            console.error('Error in submitAnswer:', error);
            socket.emit('error', { message: 'Failed to process answer' });
        }
    }));
}
