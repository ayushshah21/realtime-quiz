"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express"); // Ensure proper imports
const auth_middleware_1 = require("../middlewares/auth.middleware");
const quiz_middleware_1 = require("../middlewares/quiz.middleware");
const quiz_controller_1 = __importDefault(require("../controllers/quiz.controller"));
const router = (0, express_1.Router)();
const quizController = new quiz_controller_1.default();
router.post('/create', auth_middleware_1.authGuard, quiz_middleware_1.validQuizFormat, (req, res) => {
    quizController.createQuiz(req, res);
});
router.get('/', auth_middleware_1.authGuard, (req, res) => {
    quizController.getUserQuizzes(req, res);
});
exports.default = router;
