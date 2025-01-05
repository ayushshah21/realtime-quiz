/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect } from "react";
import { Timer, AlertCircle, Award } from "lucide-react";
import { useParams } from "react-router-dom";

interface Question {
  id: string;
  text: string;
  options: string[];
  timeLimit: number;
}

interface Score {
  username: string;
  score: number;
  correctCount: number;
  answeredCount: number;
}

interface ActiveQuizParticipantProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  socket: any;
  onQuizEnd?: () => void;
}

export const ActiveQuizParticipant: React.FC<ActiveQuizParticipantProps> = ({
  socket,
  onQuizEnd,
}) => {
  const { roomId } = useParams();
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [feedback, setFeedback] = useState<{
    isCorrect?: boolean;
    points?: number;
  } | null>(null);
  const [error, setError] = useState<string>("");
  const [scores, setScores] = useState<Score[]>([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [isQuizEnded, setIsQuizEnded] = useState(false);

  useEffect(() => {
    if (!socket) return;

    // Listen for new questions
    socket.on("new_question", (question: Question) => {
      setCurrentQuestion(question);
      setTimeRemaining(question.timeLimit);
      setSelectedAnswer(null);
      setIsAnswerSubmitted(false);
      setFeedback(null);
      setShowLeaderboard(false);
    });

    // Listen for time updates
    socket.on("time_update", ({ timeRemaining }: { timeRemaining: number }) => {
      setTimeRemaining(timeRemaining);
    });

    // Listen for answer results
    socket.on(
      "answer_result",
      (data: { correct: boolean; correctAnswer: number; points: number }) => {
        const { correct, correctAnswer, points } = data;
        if (correct) {
          setFeedback({ isCorrect: true, points });
        } else {
          setFeedback({ isCorrect: false, points: 0 });
        }
      }
    );

    // Listen for leaderboard updates
    socket.on("leaderboard_update", ({ scores }: { scores: Score[] }) => {
      setScores(scores);
      setShowLeaderboard(true);
    });

    // Listen for quiz end
    socket.on("quiz_ended", ({ finalScores }: { finalScores: Score[] }) => {
      setScores(finalScores);
      setShowLeaderboard(true);
      setIsQuizEnded(true);
      // Don't call onQuizEnd immediately, let user see the final standings
    });

    return () => {
      socket.off("new_question");
      socket.off("time_update");
      socket.off("answer_result");
      socket.off("leaderboard_update");
      socket.off("quiz_ended");
    };
  }, [socket, onQuizEnd]);

  const handleAnswerSubmit = (answerIndex: number) => {
    if (isAnswerSubmitted || !currentQuestion) return;

    try {
      setSelectedAnswer(answerIndex);
      setIsAnswerSubmitted(true);
      socket.emit("submitAnswer", {
        answer: answerIndex,
        roomId: roomId,
      });
    } catch (err) {
      setError("Failed to submit answer");
    }
  };

  if (showLeaderboard) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center mb-6">
            <Award className="w-6 h-6 text-yellow-500 mr-2" />
            <h2 className="text-2xl font-bold">
              {isQuizEnded ? "🏆 Final Results 🏆" : "Current Standings"}
            </h2>
          </div>
          <div className="space-y-4">
            {scores.map((score, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-4 rounded-lg transition-all duration-300 ${
                  isQuizEnded
                    ? index === 0
                      ? "bg-yellow-50 border-2 border-yellow-500"
                      : index === 1
                      ? "bg-gray-50 border-2 border-gray-400"
                      : index === 2
                      ? "bg-orange-50 border-2 border-orange-500"
                      : "bg-gray-50"
                    : "bg-gray-50"
                }`}
              >
                <div className="flex items-center">
                  <span
                    className={`font-mono text-lg font-bold mr-4 ${
                      isQuizEnded && index < 3
                        ? index === 0
                          ? "text-2xl text-yellow-500"
                          : index === 1
                          ? "text-2xl text-gray-500"
                          : "text-2xl text-orange-500"
                        : "text-gray-500"
                    }`}
                  >
                    {index === 0 && isQuizEnded
                      ? "🥇"
                      : index === 1 && isQuizEnded
                      ? "🥈"
                      : index === 2 && isQuizEnded
                      ? "🥉"
                      : `#${index + 1}`}
                  </span>
                  <div>
                    <p className="font-semibold">{score.username}</p>
                    <p className="text-sm text-gray-500">
                      {score.correctCount}/{score.answeredCount} correct
                    </p>
                  </div>
                </div>
                <span
                  className={`text-xl font-bold ${
                    isQuizEnded && index === 0 ? "text-yellow-500" : ""
                  }`}
                >
                  {score.score}
                </span>
              </div>
            ))}
          </div>
          {isQuizEnded && (
            <div className="mt-8 text-center">
              <p className="text-gray-600 mb-4">
                Quiz completed! Here are the final results.
              </p>
              <button
                onClick={() => onQuizEnd?.()}
                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Return to Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-500">Waiting for the quiz to start...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      {error && (
        <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            <p>{error}</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-lg p-6">
        {/* Timer */}
        <div className="flex items-center justify-end mb-4">
          <div className="flex items-center text-gray-600">
            <Timer className="w-5 h-5 mr-2" />
            <span className="font-mono">{timeRemaining}s</span>
          </div>
        </div>

        {/* Question */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">{currentQuestion.text}</h2>
        </div>

        {/* Options */}
        <div className="space-y-3">
          {currentQuestion.options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleAnswerSubmit(index)}
              disabled={isAnswerSubmitted}
              className={`w-full p-4 text-left rounded-lg transition-colors ${
                selectedAnswer === index
                  ? feedback
                    ? feedback.isCorrect
                      ? "bg-green-100 border-green-500"
                      : "bg-red-100 border-red-500"
                    : "bg-blue-100 border-blue-500"
                  : "bg-gray-50 hover:bg-gray-100"
              } ${
                isAnswerSubmitted ? "cursor-not-allowed" : "hover:bg-gray-100"
              } border-2 ${
                selectedAnswer === index
                  ? "border-current"
                  : "border-transparent"
              }`}
            >
              <span className="font-medium">{option}</span>
            </button>
          ))}
        </div>

        {/* Feedback */}
        {feedback && (
          <div
            className={`mt-6 p-4 rounded-lg ${
              feedback.isCorrect
                ? "bg-green-50 text-green-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            <p className="font-medium">
              {feedback.isCorrect ? "Correct!" : "Incorrect"}{" "}
              {feedback.points !== undefined && `(${feedback.points} points)`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
