// Define the interface for creating a new question
export interface CreateQuestionInput {
    text: string;
    options: string[];
    correctAnswer: number;
    timeLimit?: number;
    points?: number;
}

// Define the interface for creating a new quiz
export interface CreateQuizInput {
    title: string;
    description?: string;
    questions: CreateQuestionInput[];
    creatorId: string;
}

export interface createRoomInput{
    name: string;
    quizId: string;
    creatorId: string;
    code: string;
}

export interface QuizQuestion {
    id: string;
    text: string;
    options: string[];
    correctAnswer: number;
    timeLimit: number;
    points: number;
    order: number;
}

export interface ActiveQuizState {
    currentQuestionIndex: number;
    questions: QuizQuestion[];
    timer: NodeJS.Timeout | null;
}