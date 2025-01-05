import { Server, Socket } from 'socket.io';
import * as http from 'http';
import { handleQuizEvents } from '../handler/quiz.handler';
import { verifyToken } from '../utils/auth';
import { AuthenticatedSocket } from '../types/socket';

let io: Server;

export function initializeSocket(server: http.Server) {
    io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
            credentials: true
        }
    });

    io.use((socket: Socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token) {
            return next(new Error('Authentication error'));
        }

        try {
            const decoded = verifyToken(token);
            (socket as AuthenticatedSocket).userId = decoded.userId;
            next();
        } catch (err) {
            next(new Error('Authentication error'));
        }
    });

    io.on('connection', (socket: Socket) => {
        console.log(`User connected: ${socket.id}`);
        handleQuizEvents(io, socket as AuthenticatedSocket);

        socket.on('disconnect', () => {
            console.log(`User disconnected: ${socket.id}`);
        });
    });

    return io;
}

export function getIO(): Server {
    if (!io) {
        throw new Error('Socket.io not initialized!');
    }
    return io;
}