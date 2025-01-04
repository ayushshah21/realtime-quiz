import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CreateRoomModal } from "../CreateRoomModal";

interface QuizCardProps {
  quiz: {
    id: string;
    title: string;
    description: string;
    createdAt: string;
  };
}

export const QuizCard: React.FC<QuizCardProps> = ({ quiz }) => {
  const navigate = useNavigate();
  const [isCreateRoomModalOpen, setIsCreateRoomModalOpen] = useState(false);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 transition duration-300 ease-in-out transform hover:scale-105">
      <h3 className="text-xl font-semibold text-gray-800 mb-2">{quiz.title}</h3>
      <p className="text-gray-600 mb-4">{quiz.description}</p>
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-500">
          Created: {new Date(quiz.createdAt).toLocaleDateString()}
        </span>
        <div className="space-x-2">
          <button
            onClick={() => setIsCreateRoomModalOpen(true)}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
          >
            Create Room
          </button>
          <button
            onClick={() => navigate(`/quiz/${quiz.id}`)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            View Details
          </button>
        </div>
      </div>
      <CreateRoomModal
        quizId={quiz.id}
        isOpen={isCreateRoomModalOpen}
        onClose={() => setIsCreateRoomModalOpen(false)}
        onSuccess={() => {
          // Optionally refresh the quiz list
        }}
      />
    </div>
  );
};