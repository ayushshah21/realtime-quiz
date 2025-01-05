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
exports.createQuiz = createQuiz;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// POST /api/quizzes
function createQuiz(_a) {
    return __awaiter(this, arguments, void 0, function* ({ title, description, creatorId, questions }) {
        return yield prisma.quiz.create({
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
    });
}
