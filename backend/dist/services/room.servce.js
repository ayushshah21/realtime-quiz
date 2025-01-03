"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRoom = createRoom;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
function createRoom({ name }) {
    // return await prisma.room.create({
    //     data : name
    // })
}
