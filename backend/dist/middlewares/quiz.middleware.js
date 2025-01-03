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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validQuizFormat = validQuizFormat;
const zod_1 = __importDefault(require("zod"));
// Define the question schema
const questionSchema = zod_1.default.object({
    text: zod_1.default.string().min(1, "Question text is required"),
    options: zod_1.default.array(zod_1.default.string()).min(2, "At least 2 options are required"),
    correctAnswer: zod_1.default.number().min(0).max(3, "Correct answer must be a valid option index"),
    timeLimit: zod_1.default.number().min(10).max(300).optional(), // 10 seconds to 5 minutes
    points: zod_1.default.number().min(0).max(1000).optional()
});
// Define the quiz schema
const newQuizSchema = zod_1.default.object({
    title: zod_1.default.string().min(1, "Quiz title is required"),
    description: zod_1.default.string().optional(),
    questions: zod_1.default.array(questionSchema)
        .min(1, "Quiz must have at least one question")
        .max(50, "Quiz cannot have more than 50 questions")
});
function validQuizFormat(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        const validateBody = newQuizSchema.safeParse(req.body);
        if (!validateBody.success) {
            res.status(404).json({ msg: "Invalid Quiz body" });
            return;
        }
        next();
    });
}
