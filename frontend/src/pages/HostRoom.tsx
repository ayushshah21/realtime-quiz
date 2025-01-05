/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { ArrowLeft, Users, Play } from "lucide-react";
import { useWebSocket } from "../hooks/useWebSocket";
import { ActiveQuizHost } from "../components/quiz/ActiveQuizHost";

interface Participant {
  id: string;
  user: {
    email: string;
  };
}

interface Room {
  id: string;
  name: string;
  code: string;
  status: "WAITING" | "IN_PROGRESS" | "COMPLETED";
  participants: Participant[];
  quiz: {
    title: string;
  };
}

export default function HostRoom() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState<Room | null>(null);
  const [error, setError] = useState("");
  const [isStarting, setIsStarting] = useState(false);
  const socket = useWebSocket(roomId || "");

  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const response = await axios.get(
          `http://localhost:4000/api/rooms/${roomId}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        setRoom(response.data);
      } catch (err: any) {
        setError(err.response?.data?.error || "Failed to fetch room details");
      }
    };

    fetchRoom();
  }, [roomId]);

  useEffect(() => {
    if (!socket) return;

    socket.on("participantJoined", (updatedRoom) => {
      setRoom(updatedRoom);
    });

    socket.on("quizStarted", () => {
      if (room) {
        setRoom({ ...room, status: "IN_PROGRESS" });
      }
    });

    return () => {
      socket.off("participantJoined");
      socket.off("quizStarted");
    };
  }, [socket, room]);

  const handleStartQuiz = async () => {
    setIsStarting(true);
    try {
      await axios.post(
        `http://localhost:4000/api/rooms/${roomId}/start`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to start quiz");
      setIsStarting(false);
    }
  };

  const handleQuizEnd = () => {
    if (room) {
      setRoom({ ...room, status: "COMPLETED" });
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6">
          <p className="text-red-500 text-center">{error}</p>
          <button
            onClick={() => navigate("/dashboard")}
            className="mt-4 text-blue-500 hover:text-blue-700"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (room?.status === "IN_PROGRESS") {
    return <ActiveQuizHost socket={socket} onQuizEnd={handleQuizEnd} />;
  }

  if (room?.status === "COMPLETED") {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6 text-center">
          <h2 className="text-2xl font-bold mb-4">Quiz Completed</h2>
          <button
            onClick={() => navigate("/dashboard")}
            className="text-blue-500 hover:text-blue-700"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-4xl mx-auto p-6">
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center text-gray-600 hover:text-gray-800 mb-8"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Dashboard
        </button>

        <div className="bg-white rounded-lg shadow-lg p-6">
          {room && (
            <>
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">
                  {room.quiz.title}
                </h1>
                <div className="bg-gray-100 px-4 py-2 rounded-lg">
                  Room Code:{" "}
                  <span className="font-mono font-bold">{room.code}</span>
                </div>
              </div>

              <div className="mb-8">
                <h2 className="flex items-center text-lg font-semibold text-gray-700 mb-4">
                  <Users className="w-5 h-5 mr-2" />
                  Participants ({room.participants.length})
                </h2>
                <div className="bg-gray-50 rounded-lg p-4">
                  {room.participants.map((participant) => (
                    <div
                      key={participant.id}
                      className="py-2 px-4 hover:bg-gray-100 rounded"
                    >
                      {participant.user.email}
                    </div>
                  ))}
                  {room.participants.length === 0 && (
                    <p className="text-gray-500 text-center py-4">
                      Waiting for participants to join...
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleStartQuiz}
                  disabled={isStarting || room.participants.length === 0}
                  className="flex items-center px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  <Play className="w-5 h-5 mr-2" />
                  {isStarting ? "Starting..." : "Start Quiz"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
