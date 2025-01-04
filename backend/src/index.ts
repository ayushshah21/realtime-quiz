import express from "express";
import cors from "cors";
import passport from "./config/passport";
import authRoutes from "./routes/auth.routes";
import roomRoutes from "./routes/room.routes";
import quizRoutes from "./routes/quiz.routes";
import dotenv from "dotenv";
import session from "express-session";
import http from 'http';
import { setupWebSocket } from "./websockets/socketManager";


dotenv.config();

const app = express();
const server = http.createServer(app);

// Middlewares
app.use(
    session({
      secret: process.env.SESSION_SECRET || "some_secret_key",
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 1000 * 60 * 60 * 24, // 1 day
      },
    })
  );
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use(passport.initialize());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/quiz", quizRoutes);

const io = setupWebSocket(server);
app.set('io', io);  // Now accessible via req.app.get('io')

const PORT = process.env.PORT || 4000;

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});