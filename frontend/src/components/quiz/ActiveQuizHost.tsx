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
  socket: any;
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

    socket.on(
      "new_question",
      (question: Question & { totalQuestions: number }) => {
        setCurrentQuestion(question);
        setTimeRemaining(question.timeLimit);
        setTotalQuestions(question.totalQuestions);
      }
    );

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

    socket.on("leaderboard_update", ({ scores }: { scores: Score[] }) => {
      setScores(scores);
    });

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
        <div className="md:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <span className="text-sm font-medium text-gray-500">
                Question {questionNumber} of {totalQuestions || "-"}
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

        <div className="bg-white rounded-lg shadow-lg p-6 w-full h-[calc(100vh-24rem)] flex flex-col">
          <div className="flex items-center mb-4">
            <Award className="w-5 h-5 mr-2 text-yellow-500" />
            <h3 className="text-lg font-semibold">Live Leaderboard</h3>
          </div>

          <div className="space-y-3 overflow-y-auto flex-grow">
            {scores.map((score, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-4 rounded-lg w-full ${
                  index === 0
                    ? "bg-yellow-50 border border-yellow-200"
                    : index === 1
                    ? "bg-gray-50 border border-gray-200"
                    : index === 2
                    ? "bg-orange-50 border border-orange-200"
                    : "bg-white border border-gray-100"
                }`}
              >
                <div className="flex items-center space-x-4 min-w-0">
                  <span
                    className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full font-bold ${
                      index === 0
                        ? "bg-yellow-100 text-yellow-700"
                        : index === 1
                        ? "bg-gray-100 text-gray-700"
                        : index === 2
                        ? "bg-orange-100 text-orange-700"
                        : "bg-blue-50 text-blue-700"
                    }`}
                  >
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-shrink">
                    <p className="font-medium text-gray-900 truncate">
                      {score.username}
                    </p>
                    <p className="text-sm text-gray-500">
                      {score.correctCount}/{score.answeredCount} correct
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-end flex-shrink-0 ml-4">
                  <span className="font-mono font-bold text-lg text-gray-900">
                    {score.score}
                  </span>
                  <span className="ml-1 text-sm text-gray-500">pts</span>
                </div>
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
