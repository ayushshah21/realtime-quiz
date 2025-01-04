import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { Shield, Loader, PlusCircle, Users } from "lucide-react";

interface Quiz {
  id: string;
  title: string;
  description: string;
  createdAt: string;
}

export default function Dashboard() {
  const [secretData, setSecretData] = useState("");
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
          setSecretData(res.data.secretData);

          if (res.data.user && res.data.user.email) {
            setUserEmail(res.data.user.email);
            // Only fetch quizzes after successful authentication
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800">Dashboard</h2>
          <div className="space-x-4">
            <button
              onClick={handleCreateQuiz}
              className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <PlusCircle className="w-5 h-5 mr-2" />
              Create Quiz
            </button>
            <button
              onClick={handleJoinRoom}
              className="inline-flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
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
          <>

            {/* Quizzes Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {quizzes.map((quiz) => (
                <div
                  key={quiz.id}
                  className="bg-white rounded-lg shadow-lg p-6 transition duration-300 ease-in-out transform hover:scale-105"
                >
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    {quiz.title}
                  </h3>
                  <p className="text-gray-600 mb-4">{quiz.description}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">
                      Created: {new Date(quiz.createdAt).toLocaleDateString()}
                    </span>
                    <button
                      onClick={() => navigate(`/quiz/${quiz.id}`)}
                      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
