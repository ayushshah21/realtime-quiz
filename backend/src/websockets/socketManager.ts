import { Server } from 'socket.io';
import * as http from 'http';
import { handleQuizEvents } from '../handler/quiz.handler';

export function setupWebSocket(server: http.Server) {
    const io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
            credentials: true
        }
    });

    io.on('connection', (socket) => {
        console.log(`User connected: ${socket.id}`);
        handleQuizEvents(io, socket);

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