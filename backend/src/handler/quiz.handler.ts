import { Server, Socket } from 'socket.io';
import { PrismaClient, Question } from '@prisma/client';
import { activeQuizzes } from '../state/quizState';

const prisma = new PrismaClient();

interface AuthenticatedSocket extends Socket {
    userId: string;
}

interface QuizState {
    currentQuestionIndex: number;
    questions: Question[];
    timer: NodeJS.Timeout | null;
    answeredUserIds: Set<string>;
}

export function handleQuizEvents(io: Server, socket: AuthenticatedSocket) {
    // Add join room handler
    socket.on('join_room', ({ roomId }) => {
        socket.join(roomId);
        console.log(`User joined room: ${roomId}`);
    });

    // Add function to move to next question
    function moveToNextQuestion(roomId: string) {
        const quizState = activeQuizzes.get(roomId);
        if (!quizState) return;

        // Clear any existing timer
        if (quizState.timer) {
            clearInterval(quizState.timer);
            quizState.timer = null;
        }

        // Show leaderboard first
        getTopScores(roomId).then(scores => {
            // Add a delay before showing leaderboard
            setTimeout(() => {
                io.to(roomId).emit('leaderboard_update', { scores });

                // Only proceed if we haven't reached the end
                if (quizState.currentQuestionIndex < quizState.questions.length - 1) {
                    setTimeout(() => {
                        quizState.currentQuestionIndex++;
                        quizState.answeredUserIds.clear(); // Reset the set

                        const nextQuestion = quizState.questions[quizState.currentQuestionIndex];

                        io.to(roomId).emit('new_question', {
                            ...nextQuestion,
                            startTime: Date.now(),
                            timeLimit: nextQuestion.timeLimit || 30,
                            totalQuestions: quizState.questions.length
                        });

                        // Start timer for next question
                        startQuestionTimer(roomId, nextQuestion.timeLimit || 30);
                    }, 3000); // Show intermediate leaderboard for 5 seconds
                } else {
                    // For the final question, show final leaderboard
                    setTimeout(() => {
                        // First, send the final scores
                        io.to(roomId).emit('quiz_ended', {
                            message: 'Quiz completed',
                            totalQuestions: quizState.questions.length,
                            finalScores: scores
                        });

                        // Clean up the quiz state after giving time to view the results
                        setTimeout(() => {
                            activeQuizzes.delete(roomId);
                        }, 30000); // Keep quiz state for 30 seconds after completion
                    }, 5000); // Show final leaderboard for 10 seconds
                }
            }, 1000); // 2-second delay before showing leaderboard after last answer
        });
    }

    // Modify submitAnswer to call moveToNextQuestion
    socket.on('submitAnswer', async ({ roomId, answer }) => {
        try {
            const quizState = activeQuizzes.get(roomId);
            if (!quizState) return;

            const currentQuestion = quizState.questions[quizState.currentQuestionIndex];
            const isCorrect = Number(currentQuestion.correctAnswer) === Number(answer);

            // Send result back to the user immediately
            socket.emit('answer_result', {
                correct: isCorrect,
                correctAnswer: Number(currentQuestion.correctAnswer),
                points: isCorrect ? currentQuestion.points : 0
            });

            const userId = socket.userId;

            console.log('Current quiz state:', {
                currentQuestionIndex: quizState.currentQuestionIndex,
                totalQuestions: quizState.questions.length
            });

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

            // Track that this user has answered
            quizState.answeredUserIds.add(userId);

            // Check if all participants have answered
            const participants = await prisma.roomParticipant.findMany({
                where: { roomId },
                select: { userId: true }
            });

            const allAnswered = participants.every(p => quizState.answeredUserIds.has(p.userId));

            if (allAnswered) {
                // All participants have answered, move to next question
                moveToNextQuestion(roomId);
            }

        } catch (error) {
            console.error('Error in submitAnswer:', error);
            socket.emit('error', { message: 'Failed to process answer' });
        }
    });

    function startQuestionTimer(roomId: string, timeLimit: number) {
        const quizState = activeQuizzes.get(roomId);
        if (!quizState) return;

        if (quizState.timer) {
            clearInterval(quizState.timer);
        }

        const startTime = Date.now();
        let previousTimeRemaining = timeLimit;

        const intervalId = setInterval(async () => {
            const timeElapsed = Math.floor((Date.now() - startTime) / 1000);
            const timeRemaining = timeLimit - timeElapsed;

            if (timeRemaining !== previousTimeRemaining) {
                io.to(roomId).emit('time_update', {
                    timeRemaining,
                    questionIndex: quizState.currentQuestionIndex
                });
                previousTimeRemaining = timeRemaining;
            }

            if (timeRemaining <= 0) {
                clearInterval(intervalId);
                quizState.timer = null;
                moveToNextQuestion(roomId);
            }
        }, 100);

        quizState.timer = intervalId;
    }

    async function getTopScores(roomId: string, limit: number = 5) {
        const scores = await prisma.score.findMany({
            where: {
                participant: {
                    roomId: roomId
                }
            },
            orderBy: {
                score: 'desc'
            },
            take: limit,
            include: {
                user: {
                    select: {
                        email: true
                    }
                }
            }
        });

        return scores.map(score => ({
            username: score.user.email,
            score: score.score,
            correctCount: score.correctCount,
            answeredCount: score.answeredCount
        }));
    }

    async function resetScoresForRoom(roomId: string) {
        await prisma.score.deleteMany({
            where: {
                participant: {
                    roomId: roomId
                }
            }
        });
    }

    socket.on('question_timeout', ({ roomId }) => {
        moveToNextQuestion(roomId);
    });
}