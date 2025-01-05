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
        if (!quizState)
            return;
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
                        io.to(roomId).emit('new_question', Object.assign(Object.assign({}, nextQuestion), { startTime: Date.now(), timeLimit: nextQuestion.timeLimit || 30 }));
                        // Start timer for next question
                        startQuestionTimer(roomId, nextQuestion.timeLimit || 30);
                    }, 3000); // Show intermediate leaderboard for 5 seconds
                }
                else {
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
                            quizState_1.activeQuizzes.delete(roomId);
                        }, 30000); // Keep quiz state for 30 seconds after completion
                    }, 5000); // Show final leaderboard for 10 seconds
                }
            }, 1000); // 2-second delay before showing leaderboard after last answer
        });
    }
    // Modify submitAnswer to call moveToNextQuestion
    socket.on('submitAnswer', (_a) => __awaiter(this, [_a], void 0, function* ({ roomId, answer }) {
        try {
            const quizState = quizState_1.activeQuizzes.get(roomId);
            if (!quizState)
                return;
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
            // Track that this user has answered
            quizState.answeredUserIds.add(userId);
            // Check if all participants have answered
            const participants = yield prisma.roomParticipant.findMany({
                where: { roomId },
                select: { userId: true }
            });
            const allAnswered = participants.every(p => quizState.answeredUserIds.has(p.userId));
            if (allAnswered) {
                // All participants have answered, move to next question
                moveToNextQuestion(roomId);
            }
        }
        catch (error) {
            console.error('Error in submitAnswer:', error);
            socket.emit('error', { message: 'Failed to process answer' });
        }
    }));
    function startQuestionTimer(roomId, timeLimit) {
        const quizState = quizState_1.activeQuizzes.get(roomId);
        if (!quizState)
            return;
        if (quizState.timer) {
            clearInterval(quizState.timer);
        }
        const startTime = Date.now();
        let previousTimeRemaining = timeLimit;
        const intervalId = setInterval(() => __awaiter(this, void 0, void 0, function* () {
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
        }), 100);
        quizState.timer = intervalId;
    }
    function getTopScores(roomId_1) {
        return __awaiter(this, arguments, void 0, function* (roomId, limit = 5) {
            const scores = yield prisma.score.findMany({
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
        });
    }
    function resetScoresForRoom(roomId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield prisma.score.deleteMany({
                where: {
                    participant: {
                        roomId: roomId
                    }
                }
            });
        });
    }
    socket.on('question_timeout', ({ roomId }) => {
        moveToNextQuestion(roomId);
    });
}
