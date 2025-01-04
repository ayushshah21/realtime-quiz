import { Server, Socket } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import { activeQuizzes } from '../state/quizState';

const prisma = new PrismaClient();

export function handleQuizEvents(io: Server, socket: Socket) {
    // Add join room handler
    socket.on('join_room', ({ roomId }) => {
        socket.join(roomId);
        console.log(`User joined room: ${roomId}`);
    });

    // Add function to move to next question
    function moveToNextQuestion(roomId: string) {
        const quizState = activeQuizzes.get(roomId);
        if (!quizState) {
            console.log('No quiz state found for room:', roomId);
            return;
        }

        // Clear existing timer before moving to next question
        if (quizState.timer) {
            clearInterval(quizState.timer);
            quizState.timer = null;
        }

        quizState.currentQuestionIndex++;

        // Check if quiz is finished
        if (quizState.currentQuestionIndex >= quizState.questions.length) {
            console.log('Quiz ended');
            io.to(roomId).emit('quiz_ended', {
                message: 'Quiz completed',
                totalQuestions: quizState.questions.length
            });
            activeQuizzes.delete(roomId);
            return;
        }

        // Send next question with timeLimit
        const nextQuestion = quizState.questions[quizState.currentQuestionIndex];
        console.log('Sending next question:', nextQuestion);
        io.to(roomId).emit('new_question', {
            ...nextQuestion,
            startTime: Date.now(),  // Add server start time
            timeLimit: nextQuestion.timeLimit || 30 // Default 30 seconds if not set
        });

        // Start a fresh timer for the new question
        startQuestionTimer(roomId, nextQuestion.timeLimit || 30);
    }

    // Modify submitAnswer to call moveToNextQuestion
    socket.on('submitAnswer', async ({ roomId, userId, answer }) => {
        try {
            console.log('Received answer:', { roomId, userId, answer });

            const quizState = activeQuizzes.get(roomId);
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
            const participant = await prisma.roomParticipant.findUnique({
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
            await prisma.score.upsert({
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

            if (quizState.timer) {
                clearInterval(quizState.timer);
                quizState.timer = null;
            }
        } catch (error) {
            console.error('Error in submitAnswer:', error);
            socket.emit('error', { message: 'Failed to process answer' });
        }
    });

    function startQuestionTimer(roomId: string, timeLimit: number) {
        const quizState = activeQuizzes.get(roomId);
        if (!quizState) return;

        // Clear existing timer if any
        if (quizState.timer) {
            clearInterval(quizState.timer);
        }

        // Set start time
        const startTime = Date.now();

        // Emit time updates every second
        const intervalId = setInterval(() => {
            const timeElapsed = Math.floor((Date.now() - startTime) / 1000);
            const timeRemaining = timeLimit - timeElapsed;

            if (timeRemaining <= 0) {
                clearInterval(intervalId);
                // If time runs out, force move to next question
                moveToNextQuestion(roomId);
            } else {
                io.to(roomId).emit('time_update', {
                    timeRemaining,
                    questionIndex: quizState.currentQuestionIndex
                });
            }
        }, 1000);

        // Store timer reference
        quizState.timer = intervalId;
    }
}