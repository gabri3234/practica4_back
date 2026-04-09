import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { connectDB, getDB } from "../db/mongo";
import { IUser } from "../models/types";
import { ObjectId } from "mongodb";

dotenv.config();
const SECRET = process.env.JWT_SECRET || "supersecreto";

export function signToken(payload: { id: string }): string {
  return jwt.sign(payload, SECRET, { expiresIn: "7d" }); 
}

export async function getUserFromToken(
  authHeader?: string
): Promise<Omit<IUser, "password"> | null> {
  if (!authHeader) return null;
  try {
    const token = authHeader.replace(/^Bearer\s+/i, "");
    const decoded = jwt.verify(token, SECRET) as { id: string };

    await connectDB(); 
    const db = getDB();
    
    
    const user = await db.collection<IUser>("users").findOne({
      _id: new ObjectId(decoded.id),
    });

    if (!user) return null;
    const { password, ...userSafe } = user;
    return userSafe;
  } catch (err) {
    console.error("error verificando token:", err);
    return null;
  }
}