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