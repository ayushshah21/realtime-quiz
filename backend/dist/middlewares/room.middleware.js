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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validRoomName = validRoomName;
const zod_1 = __importDefault(require("zod"));
const newRoomSchema = zod_1.default.object({
    name: zod_1.default.string().min(1),
});
function validRoomName(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        const validateBody = newRoomSchema.safeParse(req.body);
        if (!validateBody.success) {
            res.status(404).json({ msg: "Invalid body" });
            return;
        }
        next();
    });
}
