import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

export const useWebSocket = (roomId: string) => {
    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        socketRef.current = io('http://localhost:4000', {
            auth: { token },
            query: { roomId }
        });

        // Join the room when socket connects
        socketRef.current.on('connect', () => {
            socketRef.current?.emit('join_room', { roomId });
        });

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, [roomId]);

    return socketRef.current;
}; 