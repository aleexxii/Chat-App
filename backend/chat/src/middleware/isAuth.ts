import type { Request, Response, NextFunction } from "express";
import dotenv from 'dotenv'
import jwt, { type JwtPayload } from "jsonwebtoken";

dotenv.config()

interface IUser extends Document {
  _id: string;
  name: string;
  email: string;
}

export interface AuthenticatedRequest extends Request {
  user?: IUser | null;
}

const JWT_SECRET = process.env.JWT_SECRET;
console.log('JWT_SECRET :' , JWT_SECRET);
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}

export const isAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer")) {
      res.status(401).json({
        message: "Please Login - No auth header",
      });
      return;
    }
    const [, token] = authHeader.split(" ");
    if (!token) {
      res.status(401).json({ message: "Invalid Bearer token" });
      return;
    }
    const decodedValue = jwt.verify(token, JWT_SECRET) as JwtPayload;

    if (!decodedValue || !decodedValue.user) {
      res.status(401).json({
        message: "Invalid token",
      });
      return;
    }

    req.user = decodedValue.user;
    next();
  } catch (error) {
    res.status(401).json({
      message: "Please Login - JWT error",
    });
  }
};


export default isAuth