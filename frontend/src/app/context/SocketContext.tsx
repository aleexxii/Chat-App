/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { io, Socket } from "socket.io-client";
import { chat_service, useAppData } from "./AppContext";

interface SocketContextType {
  socket: Socket | null;
  onlineUsers: string[];
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  onlineUsers: [],
});

interface ProviderProps {
  children: ReactNode;
}

export const SocketProvider = ({ children }: ProviderProps) => {
  const { user } = useAppData();
  const [socket, setSocket] = useState<Socket | null>(null);


  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);

  useEffect(() => {
    if (!user?._id) return;

    const newSocket = io(chat_service, {
      query: {
        userId: user._id,
      },
    });

    console.log('Socket created');

    newSocket.on('connect' , () => {
      console.log('connected', newSocket.id);
    })

    setSocket(newSocket);

    newSocket.on("getOnlineUser", (users: string[]) => {
      console.log('Reacived users : ', users);
      setOnlineUsers(users);
    });

    return () => {
      console.log('Disconnecting.');
      newSocket.disconnect();
    };
  }, [user?._id]);



  return (
    <SocketContext.Provider value={{ socket, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocketData = () => useContext(SocketContext);
