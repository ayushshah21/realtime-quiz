import React, { useState, useEffect } from "react";
import { Timer, Award } from "lucide-react";

interface Question {
  id: string;
  text: string;
  options: string[];
  timeLimit: number;
  correctAnswer: number;
}

interface Score {
  username: string;
  score: number;
  correctCount: number;
  answeredCount: number;
}

interface ActiveQuizHostProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  socket: any; // We'll properly type this later
  onQuizEnd?: () => void;
}

export const ActiveQuizHost: React.FC<ActiveQuizHostProps> = ({
  socket,
  onQuizEnd,
}) => {
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [scores, setScores] = useState<Score[]>([]);
  const [questionNumber, setQuestionNumber] = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(0);

  useEffect(() => {
    if (!socket) return;

    // Listen for new questions
    socket.on(
      "new_question",
      (question: Question & { totalQuestions: number }) => {
        setCurrentQuestion(question);
        setTimeRemaining(question.timeLimit);
        setTotalQuestions(question.totalQuestions);
      }
    );

    // Listen for time updates
    socket.on(
      "time_update",
      ({
        timeRemaining,
        questionIndex,
      }: {
        timeRemaining: number;
        questionIndex: number;
      }) => {
        setTimeRemaining(timeRemaining);
        setQuestionNumber(questionIndex + 1);
      }
    );

    // Listen for leaderboard updates
    socket.on("leaderboard_update", ({ scores }: { scores: Score[] }) => {
      setScores(scores);
    });

    // Listen for quiz end
    socket.on("quiz_ended", ({ finalScores }: { finalScores: Score[] }) => {
      setScores(finalScores);
      onQuizEnd?.();
    });

    return () => {
      socket.off("new_question");
      socket.off("time_update");
      socket.off("leaderboard_update");
      socket.off("quiz_ended");
    };
  }, [socket, onQuizEnd]);

  if (!currentQuestion) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-500">Initializing quiz...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Question and Timer */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <span className="text-sm font-medium text-gray-500">
                Question {questionNumber} of {totalQuestions}
              </span>
              <div className="flex items-center text-gray-600">
                <Timer className="w-5 h-5 mr-2" />
                <span className="font-mono">{timeRemaining}s</span>
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">
                {currentQuestion.text}
              </h2>
              <div className="space-y-3">
                {currentQuestion.options.map((option, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg ${
                      index === currentQuestion.correctAnswer
                        ? "bg-green-100 border-2 border-green-500"
                        : "bg-gray-50"
                    }`}
                  >
                    <span className="font-medium">{option}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Live Leaderboard */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center mb-4">
            <Award className="w-5 h-5 mr-2 text-yellow-500" />
            <h3 className="text-lg font-semibold">Live Leaderboard</h3>
          </div>

          <div className="space-y-4">
            {scores.map((score, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center">
                  <span className="font-mono text-gray-500 mr-3">
                    {index + 1}
                  </span>
                  <div>
                    <p className="font-medium">{score.username}</p>
                    <p className="text-sm text-gray-500">
                      {score.correctCount}/{score.answeredCount} correct
                    </p>
                  </div>
                </div>
                <span className="font-bold">{score.score}</span>
              </div>
            ))}

            {scores.length === 0 && (
              <div className="text-center text-gray-500 py-4">
                No scores yet
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
