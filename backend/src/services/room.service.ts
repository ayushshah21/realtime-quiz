import { Server, Socket } from 'socket.io';
import * as http from 'http';
import { PrismaClient } from "@prisma/client";
import { createRoomInput } from '../types/types';

const prisma = new PrismaClient();

export async function createRoom(roomData: createRoomInput) {
    return await prisma.room.create({
        data: roomData
    })
}

export async function validRoomCode(code: string) {
    console.log("Searching for room with code:", code);
    return await prisma.room.findFirst({
        where: {
            code: code,
            status: "WAITING" // Only find rooms that haven't started
        }
    });
}

export async function joinRoom({ userId, roomId }: { userId: string, roomId: string }) {
    // First check if participant already exists
    const existingParticipant = await prisma.roomParticipant.findUnique({
        where: {
            userId_roomId: {
                userId,
                roomId
            }
        }
    });

    if (existingParticipant) {
        return existingParticipant;
    }

    // If not exists, create new participant
    return await prisma.roomParticipant.create({
        data: {
            userId,
            roomId
        }
    });
}