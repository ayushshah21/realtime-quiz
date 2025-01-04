"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRoom = createRoom;
exports.validRoomCode = validRoomCode;
exports.joinRoom = joinRoom;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
function createRoom(roomData) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield prisma.room.create({
            data: roomData
        });
    });
}
function validRoomCode(code) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("Searching for room with code:", code);
        return yield prisma.room.findFirst({
            where: {
                code: code,
                status: "WAITING" // Only find rooms that haven't started
            }
        });
    });
}
function joinRoom(_a) {
    return __awaiter(this, arguments, void 0, function* ({ userId, roomId }) {
        // First check if participant already exists
        const existingParticipant = yield prisma.roomParticipant.findUnique({
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
        return yield prisma.roomParticipant.create({
            data: {
                userId,
                roomId
            }
        });
    });
}
