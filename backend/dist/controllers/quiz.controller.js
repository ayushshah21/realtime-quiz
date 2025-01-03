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
const quiz_service_1 = require("../services/quiz.service");
class QuizController {
    constructor() {
        this.createQuiz = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const creatorId = req.userId;
                const quizData = Object.assign(Object.assign({}, req.body), { creatorId });
                const quiz = yield (0, quiz_service_1.createQuiz)(quizData);
                return res.status(201).json(quiz);
            }
            catch (error) {
                return res.status(500).json({ error: "Failed to create quiz" });
            }
        });
    }
}
exports.default = QuizController;
