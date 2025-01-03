import { Server, Socket } from 'socket.io';
import * as http from 'http';
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export function createRoom({name}: {name: string}){
    // return await prisma.room.create({
    //     data : name
    // })
}