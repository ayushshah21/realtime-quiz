"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const passport_1 = __importDefault(require("./config/passport"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const room_routes_1 = __importDefault(require("./routes/room.routes"));
const quiz_routes_1 = __importDefault(require("./routes/quiz.routes"));
const dotenv_1 = __importDefault(require("dotenv"));
const express_session_1 = __importDefault(require("express-session"));
const http_1 = __importDefault(require("http"));
const socketManager_1 = require("./websockets/socketManager");
dotenv_1.default.config();
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
// Middlewares
app.use((0, express_session_1.default)({
    secret: process.env.SESSION_SECRET || "some_secret_key",
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24, // 1 day
    },
}));
app.use((0, cors_1.default)({ origin: "http://localhost:5173", credentials: true }));
app.use(express_1.default.json());
app.use(passport_1.default.initialize());
// Routes
app.use("/api/auth", auth_routes_1.default);
app.use("/api/rooms", room_routes_1.default);
app.use("/api/quiz", quiz_routes_1.default);
const io = (0, socketManager_1.setupWebSocket)(server);
app.set('io', io); // Now accessible via req.app.get('io')
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
