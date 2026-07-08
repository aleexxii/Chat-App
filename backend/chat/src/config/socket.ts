import { Server, Socket } from "socket.io";
import http from "http";
import express from "express";

const app = express();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const userSocketMap: Record<string, string> = {};

export const getRecieverSocketId = (recieverId:string) : string | undefined =>{
    return userSocketMap[recieverId]
}

io.on("connection", (socket: Socket) => {
  console.log("User Connected", socket.id);

  const userId = socket.handshake.query.userId as string | undefined;

  if (userId && userId !== "undefined") {
    userSocketMap[userId] = socket.id;
    io.emit("getOnlineUser", Object.keys(userSocketMap));
  }

  if (userId) {
    socket.join(userId);
  }
  socket.on("typing", (data) => {
    console.log(`user ${data.userId} is typing in chat ${data.chatId}`);
    socket.to(data.chatId).emit("userTyping", {
      chatId: data.chatId,
      userId: data.userId,
    });
  });

  socket.on("stopTyping", (data) => {
    console.log(`user ${data.userId} stopped typing in ${data.chatId}`);
    socket.to(data.chatId).emit("userStoppedTyping", {
      chatId: data.chatId,
      userId: data.userId,
    });
  });

  socket.on("joinChat", (chatId) => {
    socket.join(chatId);
    console.log(`user ${userId} joined chat room ${chatId}`);
  });

  socket.on("leaveChat", (chatId) => {
    socket.join(chatId);
    console.log(`user ${userId} joined chat room ${chatId}`);
  });
  // It should be placed here remove from top if any case it not working
  // io.emit('getOnline', Object.keys(userId))

  socket.on("disconnect", () => {
    console.log("User disconnected", socket.id);

    if (userId) {
      delete userSocketMap[userId];
      console.log(`user ${userId} removed from online`);
    }

    io.emit("getOnlineUser", Object.keys(userSocketMap));
  });

  socket.on("connect_error", (error) => {
    console.log("Socket connection error ", error);
  });
});

export { app, server, io };
