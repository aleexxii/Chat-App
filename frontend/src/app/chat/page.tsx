/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Suspense, useEffect, useState } from "react";
import { chat_service, useAppData, User } from "../context/AppContext";
import { useRouter, useSearchParams } from "next/navigation";
import Loading from "../components/Loading";
import ChatSidebar from "../components/ChatSidebar";
import Cookies from "js-cookie";
import axios from "axios";
import toast from "react-hot-toast";
import ChatHeader from "../components/ChatHeader";
import ChatMessages from "../components/ChatMessages";
import MessageInput from "../components/MessageInput";
import { useSocketData } from "../context/SocketContext";

export interface Message {
  _id: string;
  chatId: string;
  sender: string;
  text?: string;
  image: {
    url: string;
    publicId: string;
  };
  messageType: "text" | "image";
  delivered: boolean;
  deliveredAt?: string;
  seen: boolean;
  seenAt?: string;
  createdAt: string;
}

function ChatAppContent() {
  const {
    loading,
    isAuth,
    logoutUser,
    chats,
    user: loggedInUser,
    users,
    fetchChats,
    fetchUsers,
    setChats,
  } = useAppData();

  const { onlineUsers, socket } = useSocketData();
  const searchParams = useSearchParams();

  const [selectedUser, setSelectedUser] = useState<string | null>(
    searchParams.get("chatId"),
  );
  const [message, setMessage] = useState<string>("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [showAllUser, setShowAllUser] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<ReturnType<
    typeof setTimeout
  > | null>(null);

  const router = useRouter();

  useEffect(() => {
    if (!isAuth && !loading) {
      router.push("/login");
    }
  }, [isAuth, loading, router]);

  const handleLogout = () => logoutUser();

  const selectChat = (chatId: string | null) => {
    setSelectedUser(chatId);
    if (chatId) {
      router.replace(`/chat?chatId=${chatId}`);
    } else {
      router.replace("/chat");
    }
  };

  const fetchChat = async () => {
    const token = Cookies.get("token");

    try {
      const { data } = await axios.get(
        `${chat_service}/api/v1/message/${selectedUser}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setMessages(data.messages);
      setUser(data.user);
      await fetchChats();
    } catch (error) {
      console.log(error);
      toast.error("Failed to load messages");
    }
  };

  const moveChatToTop = (
    chatId: string,
    newMessage: any,
    updatedUnseenCount = true,
  ) => {
    let chatFound = true;

    setChats((prev) => {
      if (!prev) return null;
      const updatedChats = [...prev];
      const chatIndex = updatedChats.findIndex(
        (chat) => chat.chat._id === chatId,
      );

      if (chatIndex === -1) {
        chatFound = false;
        return prev;
      }

      const [moveChat] = updatedChats.splice(chatIndex, 1);

      const updatedChat = {
        ...moveChat,
        chat: {
          ...moveChat.chat,
          latestMessage: {
            text: newMessage.text,
            sender: newMessage.sender,
          },
          updatedAt: new Date().toString(),
          unseenCount:
            updatedUnseenCount && newMessage.sender !== loggedInUser?._id
              ? (moveChat.chat.unseenCount || 0) + 1
              : moveChat.chat.unseenCount || 0,
        },
      };
      updatedChats.unshift(updatedChat);
      return updatedChats;
    });
    if (!chatFound) fetchChats();
  };

  const resetUnseenCount = (chatId: string) => {
    setChats((prev) => {
      if (!prev) return null;

      return prev.map((chat) => {
        if (chat.chat._id == chatId) {
          return {
            ...chat,
            chat: {
              ...chat.chat,
              unseenCount: 0,
            },
          };
        }
        return chat;
      });
    });
  };

  async function createChat(u: User) {
    try {
      const token = Cookies.get("token");
      const { data } = await axios.post(
        `${chat_service}/api/v1/chat/new`,
        {
          userId: loggedInUser?._id,
          otherUserId: u._id,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      selectChat(data.chatId);
      setShowAllUser(false);
      await fetchChats();
    } catch (error) {
      toast.error("Failed to start chat");
    }
  }

  const handleMessageSend = async (e: any, imageFile?: File | null) => {
    e.preventDefault();
    if (!message.trim() && !imageFile) return;
    if (!selectedUser) return;
    // Socket Work

    if (typingTimeout) {
      clearTimeout(typingTimeout);
      setTypingTimeout(null);
    }

    socket?.emit("stopTyping", {
      chatId: selectedUser,
      userId: loggedInUser?._id,
    });

    const token = Cookies.get("token");

    try {
      const formData = new FormData();

      formData.append("chatId", selectedUser);

      if (message.trim()) {
        formData.append("text", message);
      }

      if (imageFile) {
        formData.append("image", imageFile);
      }

      const { data } = await axios.post(
        `${chat_service}/api/v1/message`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        },
      );
      setMessages((prev) => {
        const currrentMessages = prev || [];
        const messageExist = currrentMessages.some(
          (msg) => msg._id === data.message._id,
        );
        if (!messageExist) {
          return [...currrentMessages, data.message];
        }
        return currrentMessages;
      });
      setMessage("");

      const displayText = imageFile ? "image" : message;
      moveChatToTop(
        selectedUser!,
        { text: displayText, sender: data.sender },
        false,
      );
    } catch (error: any) {
      toast.error(error.response.data.message);
    }
  };

  const handleTyping = (value: string) => {
    setMessage(value);

    if (!selectedUser || !socket) return;

    // Socket Setup
    if (value.trim()) {
      socket.emit("typing", {
        chatId: selectedUser,
        userId: loggedInUser?._id,
      });
    }

    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }

    const timout = setTimeout(() => {
      socket.emit("stopTyping", {
        chatId: selectedUser,
        userId: loggedInUser?._id,
      });
    }, 2000);

    setTypingTimeout(timout);
  };

  useEffect(() => {
    socket?.on("newMessage", (message) => {
      console.log("recieved new message", message);

      if (selectedUser === message.chatId) {
        setMessages((prev) => {
          const currentMessages = prev || [];
          const messageExists = currentMessages.some(
            (msg: any) => msg._id === message._id,
          );
          if (!messageExists) {
            return [...currentMessages, message];
          }
          return currentMessages;
        });
        moveChatToTop(message.chatId, message, false);
      } else {
        moveChatToTop(message.chatId, message, true);
      }
    });

    socket?.on("messagesSeen", (data) => {
      console.log("recieved message seen", data);
      if (selectedUser === data.chatId) {
        setMessages((prev) => {
          if (!prev) return null;
          return prev.map((msg) => {
            if (
              msg.sender === loggedInUser?._id &&
              data.messageIds &&
              data.messageIds.includes(msg._id)
            ) {
              return {
                ...msg,
                seen: true,
                seenAt: new Date().toString(),
              };
            } else if (msg.sender !== loggedInUser?._id && !data.messageIds) {
              return {
                ...msg,
                seen: true,
                seenAt: new Date().toString(),
              };
            }
            return msg;
          });
        });
      }
    });

    socket?.on("messagesDelivered", (data) => {
      console.log("recieved message delivered", data);
      if (selectedUser === data.chatId) {
        setMessages((prev) => {
          if (!prev) return null;

          return prev.map((msg) => {
            if (
              msg.sender === loggedInUser?._id &&
              data.messageIds?.includes(msg._id)
            ) {
              return {
                ...msg,
                delivered: true,
                deliveredAt: data.deliveredAt || new Date().toString(),
              };
            }

            return msg;
          });
        });
      }
    });

    socket?.on("userTyping", (data) => {
      console.log("recived user typing", data);
      if (data.chatId === selectedUser && data.userId !== loggedInUser?._id) {
        setIsTyping(true);
      }
    });

    socket?.on("userStoppedTyping", (data) => {
      console.log("recived user stpped typing", data);
      if (data.chatId === selectedUser && data.userId !== loggedInUser?._id) {
        setIsTyping(false);
      }
    });

    return () => {
      socket?.off("newMessage");
      socket?.off("messagesSeen");
      socket?.off("messagesDelivered");
      socket?.off("userTyping");
      socket?.off("userStoppedTyping");
    };
  }, [socket, selectedUser, setChats, loggedInUser?._id]);

  useEffect(() => {
    if (!selectedUser) return;

    const loadChat = async () => {
      await fetchChat();
      setIsTyping(false);

      resetUnseenCount(selectedUser);

      socket?.emit("joinChat", selectedUser);
    };
    loadChat();

    return () => {
      socket?.emit("leaveChat", selectedUser);
      setMessages(null);
    };
  }, [selectedUser, socket]);

  useEffect(() => {
    return () => {
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
    };
  }, [typingTimeout]);

  if (loading) return <Loading />;
  return (
    <div className='h-screen flex bg-[#ECE5DD] text-[#111B21] relative overflow-hidden'>
      <ChatSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        showAllUsers={showAllUser}
        setShowAllUsers={setShowAllUser}
        users={users}
        loggedInUser={loggedInUser}
        chats={chats}
        selectedUser={selectedUser}
        setSelectedUser={selectChat}
        handleLogout={handleLogout}
        createChat={createChat}
        onlineUsers={onlineUsers}
      />
      <div className='flex-1 min-w-0 min-h-0 flex flex-col bg-[#ECE5DD]'>
        <ChatHeader
          user={user}
          setSidebarOpen={setSidebarOpen}
          isTyping={isTyping}
          onlineUsers={onlineUsers}
        />
        <div className='flex-1 min-h-0 overflow-hidden'>
          <ChatMessages
            selectedUser={selectedUser}
            messages={messages}
            loggedInUser={loggedInUser}
          />
        </div>
        <MessageInput
          selectedUser={selectedUser}
          message={message}
          setMessage={handleTyping}
          handleMessageSend={handleMessageSend}
        />
      </div>
    </div>
  );
}

export default function ChatApp() {
  return (
    <Suspense fallback={<Loading />}>
      <ChatAppContent />
    </Suspense>
  );
}
