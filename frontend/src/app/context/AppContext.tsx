"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  // useEffectEvent,
  useState,
} from "react";
import Cookies from "js-cookie";
import axios, { AxiosResponse } from "axios";
import toast, { Toaster } from "react-hot-toast";

export const user_service = "http://localhost:5000";
export const chat_service = "http://localhost:5002";

export interface User {
  _id: string;
  name: string;
  email: string;
}

interface MeResponse {
  user: User;
}

export interface Chat {
  _id: string;
  users: string[];
  latestMessage: {
    text: string;
    sender: string;
  };
  createdAt: string;
  updatedAt: string;
  unseenCount?: number;
}

export interface Chats {
  _id: string;
  user: User;
  chat: Chat;
}

interface AppContextType {
  user: User | null;
  loading: boolean;
  isAuth: boolean;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  setIsAuth: React.Dispatch<React.SetStateAction<boolean>>;
  logoutUser: () => Promise<void>;
  fetchUsers: () => Promise<void>;
  fetchChats: () => Promise<void>;
  chats: Chats[] | null;
  users: User[] | null;
  setChats: React.Dispatch<React.SetStateAction<Chats[] | null>>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  // const initialToken = Cookies.get("token");
  const [user, setUser] = useState<User | null>(null);
  const [isAuth, setIsAuth] = useState(false);
  const [loading, setLoading] = useState(true);
  const [chats, setChats] = useState<Chats[] | null>(null);
  const [users, setUsers] = useState<User[] | null>(null);

  const fetchUser = async () => {
    try {
      const token = Cookies.get("token");

      if (!token) {
        setLoading(false);
        setIsAuth(false);
        setUser(null);
        return;
      }

      const response: AxiosResponse<MeResponse> = await axios.get(
        `${user_service}/api/v1/me`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setUser(response.data.user);
      setIsAuth(true);
      setLoading(false);
    } catch (error) {
      console.log(error);
      setIsAuth(false);
      setUser(null);
      setLoading(false);
    }
  };

  const fetchChats = async () => {
    try {
      const token = Cookies.get("token");
      if (!token) return;
      const { data } = await axios.get(`${chat_service}/api/v1/chat/all`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setChats(data.chats);
    } catch (error) {
      console.log(error);
    }
  };

  const fetchUsers = async () => {
    try {
      const token = Cookies.get("token");
      if (!token) return;
      const { data } = await axios.get(`${user_service}/api/v1/user/all`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setUsers(data);
    } catch (error) {
      console.log(error);
    }
  };

  const logoutUser = async () => {
    Cookies.remove("token");
    setUser(null);
    setUsers(null);
    setChats(null);
    setIsAuth(false);
    toast.success("User Logged Out");
  };

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      await fetchUser();

      const token = Cookies.get("token");

      if (token && mounted) {
        await fetchChats();
        await fetchUsers();
      }
    };

    void loadData();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        isAuth,
        setIsAuth,
        loading,
        chats,
        logoutUser,
        fetchChats,
        fetchUsers,
        users,
        setChats,
      }}
    >
      {children}
      <Toaster />
    </AppContext.Provider>
  );
};

export const useAppData = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useappdata must be used within AppProvider");
  }
  return context;
};
