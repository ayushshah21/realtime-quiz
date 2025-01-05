import { Question } from '@prisma/client';

export interface ActiveQuizState {
    currentQuestionIndex: number;
    questions: Question[];
    timer: NodeJS.Timeout | null;
    answeredUserIds: Set<string>;
}

export const activeQuizzes = new Map<string, ActiveQuizState>();