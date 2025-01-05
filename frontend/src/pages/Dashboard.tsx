import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { Loader, PlusCircle, Users } from 'lucide-react';
import { QuizCard } from "../components/quiz/QuizCard";

interface Quiz {
  id: string;
  title: string;
  description: string;
  createdAt: string;
}

export default function Dashboard() {
  const [userEmail, setUserEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const res = await axios.get(
            "http://localhost:4000/api/auth/protected",
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (res.data.user && res.data.user.email) {
            setUserEmail(res.data.user.email);
            try {
              const quizzesRes = await axios.get(
                "http://localhost:4000/api/quiz",
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }
              );
              setQuizzes(quizzesRes.data);
            } catch (quizErr) {
              console.error("Failed to fetch quizzes:", quizErr);
            }
          } else {
            console.error("User data is not available in the response");
            handleLogout();
          }
        } catch (err) {
          console.error(err);
          handleLogout();
        } finally {
          setLoading(false);
        }
      } else {
        navigate("/login");
      }
    };

    fetchData();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await axios.get("http://localhost:4000/api/auth/logout");
      localStorage.removeItem("token");
      navigate("/login");
    } catch (err) {
      console.error("Logout failed:", err);
      localStorage.removeItem("token");
      navigate("/login");
    }
  };

  const handleCreateQuiz = () => {
    navigate("/create-quiz");
  };

  const handleJoinRoom = () => {
    navigate("/join-room");
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {userEmail && <Navbar userEmail={userEmail} />}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4 sm:mb-0">Dashboard</h1>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
            <button
              onClick={handleCreateQuiz}
              className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 w-full sm:w-auto"
            >
              <PlusCircle className="w-5 h-5 mr-2" />
              Create Quiz
            </button>
            <button
              onClick={handleJoinRoom}
              className="inline-flex items-center justify-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 w-full sm:w-auto"
            >
              <Users className="w-5 h-5 mr-2" />
              Join Room
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-12">
            <Loader className="w-12 h-12 text-blue-500 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {quizzes.map((quiz) => (
              <QuizCard key={quiz.id} quiz={quiz} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

