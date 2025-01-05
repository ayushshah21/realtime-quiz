import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { ArrowLeft, Users } from "lucide-react";
import { useWebSocket } from "../hooks/useWebSocket";

interface Room {
  id: string;
  name: string;
  code: string;
  status: "WAITING" | "IN_PROGRESS" | "COMPLETED";
  participants: {
    id: string;
    user: {
      email: string;
    };
  }[];
  quiz: {
    title: string;
  };
}

export default function ParticipantRoom() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState<Room | null>(null);
  const [error, setError] = useState("");
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        setError(err.response?.data?.error || "Failed to fetch room details");
      }
    };

    fetchRoom();
    // Add WebSocket connection here later
  }, [roomId]);

  useEffect(() => {
    if (!socket) return;

    console.log("Setting up socket listeners");

    socket.on("participantJoined", (updatedRoom) => {
      console.log("Participant joined event received:", updatedRoom);
      setRoom(updatedRoom);
    });

    socket.on("quizStarted", () => {
      console.log("Quiz started event received");
    });

    return () => {
      socket.off("participantJoined");
      socket.off("quizStarted");
    };
  }, [socket]);

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
                  Status: <span className="font-semibold">{room.status}</span>
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
                </div>
              </div>

              {room.status === "WAITING" && (
                <div className="text-center text-gray-600">
                  Waiting for host to start the quiz...
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
