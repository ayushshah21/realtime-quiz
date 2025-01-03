// import EventModel from '../models/eventModel';
import { NextFunction, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv'
import { createRoom } from '../services/room.service';

dotenv.config();


export default class RoomController {
    createRoom = async (req: Request, res: Response) => {
        try {
            const code = generateRoomCode();
            const creatorId = (req as any).userId;
            const roomData = {
                ...req.body,
                code,
                creatorId
            }
            const room = await createRoom(roomData);
            return res.status(201).json(room);
        }
        catch (error) {
            return res.status(500).json({ error: "Failed to create room" });
        }
    }
}


function generateRoomCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}