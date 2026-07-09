import axios from "axios";
import TryCatch from "../config/TryCatch.js";
import type { AuthenticatedRequest } from "../middleware/isAuth.js";
import { Chat } from "../models/Chat.js";
import { Messages } from "../models/Messages.js";
import type { Response } from "express";
import { getRecieverSocketId, io } from "../config/socket.js";

export const createNewChat = TryCatch(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?._id;
    const { otherUserId } = req.body;

    if (!otherUserId) {
      return res.status(400).json({
        message: "Other userId is required",
      });
    }

    const existingChat = await Chat.findOne({
      users: { $all: [userId, otherUserId], $size: 2 },
    });


    if (existingChat) {
      return res.json({
        message: "Chat already exist",
        chatId: existingChat._id,
      });
    }

    const newChat = await Chat.create({
      users: [userId, otherUserId],
    });

    res.status(201).json({
      message: "New chat created",
      chatId: newChat._id,
    });
  },
);

export const getAllChats = TryCatch(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?._id;

    if (!userId) {
      res.status(400).json({
        message: "UserId missing",
      });
      return;
    }

    const chats = await Chat.find({ users: { $in: [userId] } }).sort({
      updatedAt: -1,
    });

    const chatWithUserData = await Promise.all(
      chats.map(async (chat) => {
        const otherUserId = chat.users.find(
          (id) => id.toString() !== userId.toString(),
        );

        const unseenCount = await Messages.countDocuments({
          chatId: chat._id,
          sender: { $ne: userId },
          seen: false,
        });

        try {
          const { data } = await axios.get(
            `${process.env.USER_SERVICE}/api/v1/user/${otherUserId}`,
          );

          return {
            user: data,
            chat: {
              ...chat.toObject(),
              latestMessage: chat.latestMessage || null,
              unseenCount,
            },
          };
        } catch (error) {
          console.log(error);
          return {
            user: { _id: otherUserId, name: "Unknown User" },
            chat: {
              ...chat.toObject(),
              latestMessage: chat.latestMessage || null,
              unseenCount,
            },
          };
        }
      }),
    );

    //     const chatWithUserData = await Promise.all(
    //   chats.map(async (chat) => {
    //     const otherUserId = chat.users.find(
    //       (id) => id.toString() !== userId.toString(),
    //     );

    //     const unseenCount = await Messages.countDocuments({
    //       chatId: chat._id,
    //       sender: { $ne: userId },
    //       seen: false,
    //     });

    //     try {
    //       const { data } = await axios.get(
    //         `${process.env.USER_SERVICE}/api/v1/user/${otherUserId}`,
    //       );

    //       return {
    //         user: data,
    //         chat: {
    //           ...chat.toObject(),
    //           latestMessage: chat.latestMessage || null,
    //           unseenCount,
    //         },
    //       };
    //     } catch (error) {
    //       console.log(error);

    //       return {
    //         user: {
    //           _id: otherUserId,
    //           name: "Unknown User",
    //         },
    //         chat: {
    //           ...chat.toObject(),
    //           latestMessage: chat.latestMessage || null,
    //           unseenCount,
    //         },
    //       };
    //     }
    //   }),
    // );
    res.json({
      chats: chatWithUserData,
    });
  },
);

export const sendMessage = TryCatch(
  async (req: AuthenticatedRequest, res: Response) => {
    console.log('Reached');
    if (!req.user?._id)
      return res.status(401).json({ message: "Unauthorized" });
    const senderId = req.user?._id;
    const { chatId, text } = req.body;
    const imageFile = req.file;
    console.log("image :",req.files);

    if (!senderId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }
    if (!chatId) {
      return res.status(422).json({
        message: "ChatId required",
      });
    }
    if (!text && !imageFile) {
      return res.status(422).json({
        message: "Either text or image is required",
      });
    }

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({
        message: "Chat not found",
      });
    }

    const isUserInChat = chat.users.some(
      (userId) => userId.toString() === senderId.toString(),
    );

    if (!isUserInChat) {
      return res.status(403).json({
        message: "You are not a participant of this chat",
      });
    }

    const otherUserId = chat.users.find(
      (userId) => userId.toString() !== senderId.toString(),
    );

    if (!otherUserId) {
      return res.status(401).json({
        message: "No other user",
      });
    }

    // Socket setup
    const receiverSocketId = getRecieverSocketId(otherUserId.toString())
    const isReceiverOnline = Boolean(receiverSocketId);
    let isRecieverInChatRoom = false

    if(receiverSocketId){
      const receiverSocket = io.sockets.sockets.get(receiverSocketId)

      if(receiverSocket && receiverSocket.rooms.has(chatId)){
        isRecieverInChatRoom = true
      }
    }

    const messageData: any = {
      chatId: chatId,
      sender: senderId,
      delivered: isReceiverOnline,
      deliveredAt: isReceiverOnline ? new Date() : undefined,
      seen: isRecieverInChatRoom,
      seenAt: isRecieverInChatRoom ? new Date() : undefined,
    };

    if (imageFile) {
      messageData.image = {
        url: imageFile.path,
        publicId: imageFile.filename,
      };
      messageData.messageType = "image";
      messageData.text = text || "";
    } else {
      messageData.text = text;
      messageData.messageType = "text";
    }

    const message = new Messages(messageData);
    const savedMessage = await message.save();

    const latestMessageText = imageFile ? "📷" : text;

    await Chat.findByIdAndUpdate(
      chatId,
      {
        latestMessage: {
          text: latestMessageText,
          sender: senderId,
        },
        updatedAt: new Date(),
      },
      { new: true },
    );

    // Emit to socket
    io.to(chatId).emit('newMessage', savedMessage)

    if(receiverSocketId){
      io.to(receiverSocketId).emit('newMessage', savedMessage)
    }

    const senderSocketId = getRecieverSocketId(senderId.toString())
    if(senderSocketId){
      io.to(senderSocketId).emit('newMessage', savedMessage)
    }

    if(isRecieverInChatRoom && senderSocketId){
      io.to(senderSocketId).emit('messagesSeen',{
        chatId : chatId
        ,
        seenBy : otherUserId,
        messageIds : [savedMessage._id]
      })
    }

    res.status(201).json({
      message: savedMessage,
      sender: senderId,
    });
  },
);

export const getMessagesByChat = TryCatch(
  async (req: AuthenticatedRequest, res: Response) => {
    const currentUserId  = req.user?._id;
    const { chatId } = req.params;

    if (!chatId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }
    if (!currentUserId ) {
      return res.status(400).json({
        message: "userId required",
      });
    }

    const chat = await Chat.findById(chatId);

    if (!chat) {
      return res.status(404).json({
        message: "chat not found",
      });
    }
    const isUserInChat = chat.users.some(
      (userId) => userId.toString() === currentUserId .toString(),
    );

    if (!isUserInChat) {
      return res.status(403).json({
        message: "You are not a participant of this chat",
      });
    }
    const messagesToMarkSeen = await Messages.find({
      chatId: chatId,
      sender: { $ne: currentUserId  },
      seen: false,
    });

    await Messages.updateMany(
      {
        chatId: chatId,
        sender: { $ne: currentUserId  },
        seen: false,
      },
      {
        seen: true,
        seenAt: new Date(),
      },
    );
    const messages = await Messages.find({ chatId }).sort({ createdAt: 1 });

    const otherUserId = chat.users.find((id) => id !== currentUserId );

    try {
      const { data } = await axios.get(
        `${process.env.USER_SERVICE}/api/v1/user/${otherUserId}`,
      );
      if (!otherUserId) {
        return res.status(400).json({
          message: "No other user",
        });
      }

      //socket work
      if(messagesToMarkSeen.length> 0){
        const otherUserSocketId = getRecieverSocketId(otherUserId.toString())
        if(otherUserSocketId){
          io.to(otherUserSocketId).emit('messagesSeen',{
            chatId : chatId,
            seenBy : currentUserId ,
            messageIds : messagesToMarkSeen.map((msg) => msg._id)
          })
        }
      }

      res.json({
        messages,
        user: data,
      });
    } catch (error) {
      console.log(error);
      res.json({
        messages,
        user: { _id: otherUserId, name: "Unknown user" },
      });
    }
  },
);
