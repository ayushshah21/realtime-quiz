import { Router, Request, Response } from "express"; // Ensure proper imports
import passport from "../config/passport";
import * as authController from "../controllers/auth.controller";
import { authGuard } from "../middlewares/auth.middleware";
import { validQuizFormat } from "../middlewares/quiz.middleware";
import QuizController from "../controllers/quiz.controller";

const router = Router();
const quizController = new QuizController();

router.post('/create', authGuard, validQuizFormat, (req: Request, res: Response) => {
    quizController.createQuiz(req, res);
})

router.get('/', authGuard, (req: Request, res: Response) => {
    quizController.getUserQuizzes(req, res);
})

export default router;
