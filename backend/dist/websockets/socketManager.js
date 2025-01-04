"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeSocket = initializeSocket;
exports.getIO = getIO;
const socket_io_1 = require("socket.io");
const quiz_handler_1 = require("../handler/quiz.handler");
let io;
function initializeSocket(server) {
    io = new socket_io_1.Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
            credentials: true
        }
    });
    io.on('connection', (socket) => {
        console.log(`User connected: ${socket.id}`);
        (0, quiz_handler_1.handleQuizEvents)(io, socket);
        socket.on('message', (message) => {
            console.log("Received user message");
            socket.emit('message', "Client just sent me this: " + message);
        });
        socket.on('disconnect', () => {
            console.log(`User disconnected: ${socket.id}`);
        });
    });
    return io;
}
function getIO() {
    if (!io) {
        throw new Error('Socket.IO not initialized');
    }
    return io;
}
