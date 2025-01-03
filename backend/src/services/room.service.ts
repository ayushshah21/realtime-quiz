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

export async function validRoomCode({ code }: { code: string }) {
    return await prisma.room.findFirst({
        where: { code }
    })
}

export async function joinRoom({userId, roomId}: {userId: string, roomId: string}) {
    return await prisma.roomParticipant.create({
        data: {
            userId,
            roomId
        }
    })
}