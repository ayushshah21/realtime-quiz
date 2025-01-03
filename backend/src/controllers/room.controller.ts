// import EventModel from '../models/eventModel';
import { NextFunction, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv'
import { createRoom } from '../services/room.servce';

dotenv.config();


export default class RoomController {
    createRoom = async(req: Request, res: Response) => {
        const code = generateRoomCode();
        const room = await createRoom(req.body);
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