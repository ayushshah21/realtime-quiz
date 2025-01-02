import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { Shield, Loader, AlertCircle } from 'lucide-react';

export default function Dashboard() {
  const [secretData, setSecretData] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [loading, setLoading] = useState(true);
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
      // Call logout endpoint to clear session
      await axios.get("http://localhost:4000/api/auth/logout");

      // Clear local storage
      localStorage.removeItem("token");

      // Redirect to login
      navigate("/login");
    } catch (err) {
      console.error("Logout failed:", err);
      // Still remove token and redirect even if server logout fails
      localStorage.removeItem("token");
      navigate("/login");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {userEmail && <Navbar userEmail={userEmail} />}
      <div className="container mx-auto p-6">
        <h2 className="text-3xl font-bold text-gray-800 mb-6">Dashboard</h2>
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <Loader className="w-12 h-12 text-blue-500 animate-spin" />
          </div>
        ) : secretData ? (
          <div className="bg-white rounded-lg shadow-lg p-6 transition duration-300 ease-in-out transform hover:scale-105">
            <div className="flex items-center space-x-3 mb-4">
              <Shield className="w-8 h-8 text-green-500" />
              <h3 className="text-2xl font-semibold text-gray-700">Protected Information</h3>
            </div>
            <p className="text-gray-600 text-lg leading-relaxed">{secretData}</p>
          </div>
        ) : (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg shadow-md" role="alert">
            <div className="flex items-center">
              <AlertCircle className="w-6 h-6 mr-2" />
              <p>No protected data available.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

