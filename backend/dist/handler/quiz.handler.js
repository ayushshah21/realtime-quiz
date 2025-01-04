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
        // Clear existing timer
        if (quizState.timer) {
            clearInterval(quizState.timer);
            quizState.timer = null;
        }
        // Show leaderboard first
        getTopScores(roomId).then(scores => {
            io.to(roomId).emit('leaderboard_update', { scores });
            // Wait 3 seconds before moving to next question
            setTimeout(() => {
                quizState.currentQuestionIndex++;
                if (quizState.currentQuestionIndex >= quizState.questions.length) {
                    io.to(roomId).emit('quiz_ended', {
                        message: 'Quiz completed',
                        totalQuestions: quizState.questions.length,
                        finalScores: scores
                    });
                    quizState_1.activeQuizzes.delete(roomId);
                    return;
                }
                const nextQuestion = quizState.questions[quizState.currentQuestionIndex];
                io.to(roomId).emit('new_question', Object.assign(Object.assign({}, nextQuestion), { startTime: Date.now(), timeLimit: nextQuestion.timeLimit || 30 }));
                startQuestionTimer(roomId, nextQuestion.timeLimit || 30);
            }, 3000); // Show leaderboard for 3 seconds
        });
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
            if (quizState.timer) {
                clearInterval(quizState.timer);
                quizState.timer = null;
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
            }
            else {
                io.to(roomId).emit('time_update', {
                    timeRemaining,
                    questionIndex: quizState.currentQuestionIndex
                });
            }
        }, 1000);
        // Store timer reference
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
}
