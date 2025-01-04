import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { AlertCircle, Loader } from "lucide-react";

interface Question {
  text: string;
  options: string[];
  correctAnswer: number;
  timeLimit: number;
  points: number;
}

interface QuizForm {
  title: string;
  description: string;
  questions: Question[];
}

const CreateQuiz: React.FC = () => {
  const navigate = useNavigate();
  const [quizData, setQuizData] = useState<QuizForm>({
    title: "",
    description: "",
    questions: [],
  });

  const [currentQuestion, setCurrentQuestion] = useState<Question>({
    text: "",
    options: ["", "", "", ""],
    correctAnswer: 0,
    timeLimit: 30,
    points: 100,
  });

  const [error, setError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateQuestion = (question: Question): string | null => {
    if (!question.text.trim()) {
      return "Question text is required";
    }
    if (question.options.filter((opt) => opt.trim()).length < 2) {
      return "At least 2 options are required";
    }
    if (question.timeLimit < 10 || question.timeLimit > 300) {
      return "Time limit must be between 10 and 300 seconds";
    }
    if (question.points < 0 || question.points > 1000) {
      return "Points must be between 0 and 1000";
    }
    return null;
  };

  const addQuestion = () => {
    const validationError = validateQuestion(currentQuestion);
    if (validationError) {
      setError(validationError);
      return;
    }

    setQuizData((prev) => ({
      ...prev,
      questions: [...prev.questions, currentQuestion],
    }));
    setCurrentQuestion({
      text: "",
      options: ["", "", "", ""],
      correctAnswer: 0,
      timeLimit: 30,
      points: 100,
    });
    setError("");
  };

  const handleQuizSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    if (!quizData.title.trim()) {
      setError("Quiz title is required");
      setIsSubmitting(false);
      return;
    }

    if (quizData.questions.length === 0) {
      setError("At least one question is required");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await axios.post(
        "http://localhost:4000/api/quiz/create",
        quizData,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.status === 201) {
        navigate("/dashboard");
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setError(error.response?.data?.error || "Failed to create quiz");
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Create New Quiz</h1>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            <p>{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleQuizSubmit} className="space-y-6">
        <div>
          <label className="block mb-2">Quiz Title</label>
          <input
            type="text"
            value={quizData.title}
            onChange={(e) =>
              setQuizData({ ...quizData, title: e.target.value })
            }
            className="w-full p-2 border rounded"
            required
          />
        </div>

        <div>
          <label className="block mb-2">Description</label>
          <textarea
            value={quizData.description}
            onChange={(e) =>
              setQuizData({ ...quizData, description: e.target.value })
            }
            className="w-full p-2 border rounded"
          />
        </div>

        {/* Display added questions */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">
            Questions ({quizData.questions.length})
          </h2>
          {quizData.questions.map((q, idx) => (
            <div key={idx} className="p-4 border rounded">
              <p>
                <strong>Question {idx + 1}:</strong> {q.text}
              </p>
              <p>
                <strong>Options:</strong>
              </p>
              <ul className="list-disc pl-6">
                {q.options.map((opt, i) => (
                  <li
                    key={i}
                    className={i === q.correctAnswer ? "text-green-600" : ""}
                  >
                    {opt}
                  </li>
                ))}
              </ul>
              <div className="mt-2 text-sm text-gray-500">
                Time Limit: {q.timeLimit}s | Points: {q.points}
              </div>
            </div>
          ))}
        </div>

        {/* Add new question form */}
        <div className="border p-4 rounded space-y-4">
          <h3 className="text-lg font-semibold">Add New Question</h3>
          <div>
            <label className="block mb-2">Question Text</label>
            <input
              type="text"
              value={currentQuestion.text}
              onChange={(e) =>
                setCurrentQuestion({ ...currentQuestion, text: e.target.value })
              }
              className="w-full p-2 border rounded"
            />
          </div>

          <div>
            <label className="block mb-2">Options</label>
            {currentQuestion.options.map((opt, idx) => (
              <div key={idx} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={opt}
                  onChange={(e) => {
                    const newOptions = [...currentQuestion.options];
                    newOptions[idx] = e.target.value;
                    setCurrentQuestion({
                      ...currentQuestion,
                      options: newOptions,
                    });
                  }}
                  className="flex-1 p-2 border rounded"
                  placeholder={`Option ${idx + 1}`}
                />
                <input
                  type="radio"
                  name="correctAnswer"
                  checked={currentQuestion.correctAnswer === idx}
                  onChange={() =>
                    setCurrentQuestion({
                      ...currentQuestion,
                      correctAnswer: idx,
                    })
                  }
                />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-2">Time Limit (seconds)</label>
              <input
                type="number"
                value={currentQuestion.timeLimit}
                onChange={(e) =>
                  setCurrentQuestion({
                    ...currentQuestion,
                    timeLimit: parseInt(e.target.value) || 30,
                  })
                }
                className="w-full p-2 border rounded"
                min="10"
                max="300"
              />
              <p className="text-sm text-gray-500 mt-1">
                Between 10 and 300 seconds
              </p>
            </div>
            <div>
              <label className="block mb-2">Points</label>
              <input
                type="number"
                value={currentQuestion.points}
                onChange={(e) =>
                  setCurrentQuestion({
                    ...currentQuestion,
                    points: parseInt(e.target.value) || 0,
                  })
                }
                className="w-full p-2 border rounded"
                min="0"
                max="1000"
              />
              <p className="text-sm text-gray-500 mt-1">
                Between 0 and 1000 points
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={addQuestion}
            className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:bg-blue-300"
            disabled={isSubmitting}
          >
            Add Question
          </button>
        </div>

        <button
          type="submit"
          className="w-full bg-green-500 text-white p-2 rounded hover:bg-green-600 disabled:bg-green-300"
          disabled={quizData.questions.length === 0 || isSubmitting}
        >
          {isSubmitting ? (
            <div className="flex items-center justify-center">
              <Loader className="w-5 h-5 animate-spin mr-2" />
              Creating Quiz...
            </div>
          ) : (
            "Create Quiz"
          )}
        </button>
      </form>
    </div>
  );
};

export default CreateQuiz;
