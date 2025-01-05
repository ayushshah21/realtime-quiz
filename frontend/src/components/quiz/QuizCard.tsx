import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CreateRoomModal } from "../CreateRoomModal";
import { CalendarIcon, UsersIcon, ChevronRightIcon } from "lucide-react";

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
    <div className="bg-white rounded-xl shadow-md overflow-hidden flex flex-col h-full">
      <div className="p-4 sm:p-6 flex-1 flex flex-col">
        <h3 className="text-lg sm:text-xl font-semibold text-gray-800 line-clamp-1 mb-2">
          {quiz.title}
        </h3>
        <p className="text-sm sm:text-base text-gray-600 line-clamp-1 truncate mb-2 min-h-[1.25rem]">
          {quiz.description}
        </p>

        <div className="flex items-center text-xs sm:text-sm text-gray-500 mt-2">
          <CalendarIcon className="w-4 h-4 mr-1 flex-shrink-0" />
          <span>{new Date(quiz.createdAt).toLocaleDateString()}</span>
        </div>
      </div>

      <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gray-50 border-t border-gray-100">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
          <button
            onClick={() => setIsCreateRoomModalOpen(true)}
            className="w-full sm:w-auto flex items-center justify-center px-4 py-2 bg-green-500 text-white text-sm rounded-full hover:bg-green-600 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
          >
            <UsersIcon className="w-4 h-4 mr-2" />
            Create Room
          </button>
          <button
            onClick={() => navigate(`/quiz/${quiz.id}`)}
            className="w-full sm:w-auto flex items-center justify-center text-blue-600 text-sm hover:text-blue-800 transition-colors focus:outline-none focus:underline"
          >
            View Details
            <ChevronRightIcon className="w-4 h-4 ml-1" />
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
