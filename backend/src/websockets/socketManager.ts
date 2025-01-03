import { Server } from 'socket.io';
import * as http from 'http';


export function setupWebSocket(server: http.Server) {
    const io = new Server(server, {
        cors: {
            origin: "*",  // Allow all origins for testing
            methods: ["GET", "POST"]
        }
    });

    io.on('connection', (socket) => {
        console.log(`User connected: ${socket.id}`);


        // handleRoomEvents(io, socket);

        socket.on('message', (message) => {
            console.log("Received user message");
            socket.emit('message', "Client just sent me this: " + message);
        })

        socket.on('disconnect', () => {
            console.log(`User disconnected: ${socket.id}`);
        })
    })


}