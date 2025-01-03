import z from 'zod';
import express, { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';


const newRoomSchema = z.object({
    name: z.string().min(1),
})

export async function validRoomName(req: Request, res: Response, next: NextFunction){
    const validateBody = newRoomSchema.safeParse(req.body);
    if(!validateBody.success){
        res.status(404).json({msg: "Invalid body"});
        return;
    }
    next();
}
