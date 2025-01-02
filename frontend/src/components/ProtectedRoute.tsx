import { ReactNode, useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import axios from "axios";

interface Props {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: Props) {
  const navigate = useNavigate();
  const [isValidating, setIsValidating] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const validateToken = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setIsValidating(false);
        return;
      }

      try {
        console.log("Validating token:", token);
        const response = await axios.get(
          "http://localhost:4000/api/auth/protected",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            withCredentials: true,
          }
        );

        console.log("Protected route response:", response.data);

        if (response.data.user) {
          setIsAuthenticated(true);
        }
      } catch (err) {
        console.error("Token validation failed:", err);
        localStorage.removeItem("token");
      } finally {
        setIsValidating(false);
      }
    };

    validateToken();
  }, [navigate]);

  if (isValidating) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
