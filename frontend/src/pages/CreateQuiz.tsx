import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

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

  const handleQuizSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:4000/api/quizzes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(quizData),
      });

      if (response.ok) {
        const quiz = await response.json();
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Failed to create quiz:", error);
    }
  };

  const addQuestion = () => {
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
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Create New Quiz</h1>

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
                    timeLimit: parseInt(e.target.value),
                  })
                }
                className="w-full p-2 border rounded"
                min="5"
                max="300"
              />
            </div>
            <div>
              <label className="block mb-2">Points</label>
              <input
                type="number"
                value={currentQuestion.points}
                onChange={(e) =>
                  setCurrentQuestion({
                    ...currentQuestion,
                    points: parseInt(e.target.value),
                  })
                }
                className="w-full p-2 border rounded"
                min="0"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={addQuestion}
            className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
          >
            Add Question
          </button>
        </div>

        <button
          type="submit"
          className="w-full bg-green-500 text-white p-2 rounded hover:bg-green-600"
          disabled={quizData.questions.length === 0}
        >
          Create Quiz
        </button>
      </form>
    </div>
  );
};

export default CreateQuiz;
