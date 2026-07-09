import { Server, Socket } from "socket.io";
import http from "http";
import express from "express";
import { Chat } from "../models/Chat.js";
import { Messages } from "../models/Messages.js";

const app = express();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const userSocketMap: Record<string, string> = {};

export const getRecieverSocketId = (recieverId: string): string | undefined => {
  return userSocketMap[recieverId];
};

io.on("connection", (socket: Socket) => {
  console.log("User Connected", socket.id);

  const userId = socket.handshake.query.userId as string | undefined;

  if (userId && userId !== "undefined") {
    userSocketMap[userId] = socket.id;
    io.emit("getOnlineUser", Object.keys(userSocketMap));
  }

  if (userId) {
    socket.join(userId);

    void (async () => {
      const chats = await Chat.find({ users: { $in: [userId] } }).select("_id");
      const chatIds = chats.map((chat) => chat._id);

      if (chatIds.length === 0) return;

      const undeliveredMessages = await Messages.find({
        chatId: { $in: chatIds },
        sender: { $ne: userId },
        delivered: false,
      }).select("_id chatId sender");

      if (undeliveredMessages.length === 0) return;

      const deliveredAt = new Date();
      const messageIds = undeliveredMessages.map((message) => message._id);

      await Messages.updateMany(
        { _id: { $in: messageIds } },
        { delivered: true, deliveredAt },
      );

      const messagesBySenderAndChat = undeliveredMessages.reduce<
        Record<
          string,
          { sender: string; chatId: string; messageIds: unknown[] }
        >
      >((acc, message) => {
        const chatId = message.chatId.toString();
        const key = `${message.sender}:${chatId}`;

        if (!acc[key]) {
          acc[key] = {
            sender: message.sender,
            chatId,
            messageIds: [],
          };
        }

        acc[key].messageIds.push(message._id);
        return acc;
      }, {});

      Object.values(messagesBySenderAndChat).forEach((data) => {
        io.to(data.sender).emit("messagesDelivered", {
          chatId: data.chatId,
          deliveredTo: userId,
          messageIds: data.messageIds,
          deliveredAt,
        });
      });
    })().catch((error) => {
      console.log("Failed to mark messages delivered", error);
    });
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
    socket.leave(chatId);
    console.log(`user ${userId} left chat room ${chatId}`);
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
