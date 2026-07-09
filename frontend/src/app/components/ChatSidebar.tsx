/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { Chats, User } from "../context/AppContext";
import {
  CornerDownRight,
  CornerUpLeft,
  LogOut,
  MessageCircle,
  Plus,
  Search,
  UserCircle,
  X,
} from "lucide-react";
import Link from "next/link";

interface ChatSidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  showAllUsers: boolean;
  setShowAllUsers: (show: boolean | ((prev: boolean) => boolean)) => void;
  users: User[] | null;
  loggedInUser: User | null;
  chats: Chats[] | null;
  selectedUser: string | null;
  setSelectedUser: (userId: string | null) => void;
  handleLogout: () => void;
  createChat: (user: User) => void;
  onlineUsers: string[];
}

const ChatSidebar = ({
  sidebarOpen,
  setSidebarOpen,
  setShowAllUsers,
  showAllUsers,
  users,
  loggedInUser,
  chats,
  selectedUser,
  setSelectedUser,
  handleLogout,
  createChat,
  onlineUsers,
}: ChatSidebarProps) => {
  const [searchQuery, setSearchQuery] = useState("");

  const handleChatClick = (chatId: string) => {
    setSelectedUser(chatId);
    setSidebarOpen(false);
  };

  return (
    <aside
      className={`fixed z-20 sm:static top-0 left-0 h-screen w-80 bg-white border-r border-[#D1D7DB] transform ${
        sidebarOpen ? "translate-x-0 " : "-translate-x-full"
      } sm:translate-x-0 transition-transform duration-300 flex flex-col`}
    >
      {/* Header */}
      <div className='p-6 border-b border-[#D1D7DB] bg-[#075E54]'>
        <div className='sm:hidden flex justify-end mb-0'>
          <button
            onClick={() => setSidebarOpen(false)}
            className='p-2 hover:bg-white/10 rounded-lg transition-colors'
          >
            <X className='w-5 h-5 text-white' />
          </button>
        </div>

        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            <div className='p-2 bg-[#25D366] rounded-lg justify-between'>
              <MessageCircle className='w-5 h-5 text-white' />
            </div>
            <h2 className='text-xl font-bold text-white'>
              {showAllUsers ? "New Chat" : "Message"}
            </h2>
          </div>

          <button
            className={`p-2.5 rounded-lg transition-colors ${
              showAllUsers
                ? "bg-[#E57373] hover:bg-[#D9534F] text-white"
                : "bg-[#25D366] hover:bg-[#20BD5A] text-white"
            }`}
            onClick={() => setShowAllUsers((prev) => !prev)}
          >
            {showAllUsers ? (
              <X className='w-4 h-4' />
            ) : (
              <Plus className='w-4 h-4' />
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className='flex-1 overflow-hidden px-4 py-2'>
        {showAllUsers ? (
          <div className='space-y-4 h-full'>
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#667781]' />
              <input
                type='text'
                placeholder='Search Users...'
                className='w-full pl-10 pr-4 py-3 bg-[#F0F2F5] border border-[#D1D7DB] text-[#111B21] placeholder-[#667781] rounded-lg focus:outline-none focus:border-[#128C7E]'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* userlist */}
            <div className='space-y-2 overflow-y-auto h-full pb-4'>
              {users
                ?.filter(
                  (u) =>
                    u._id !== loggedInUser?._id &&
                    u.name.toLowerCase().includes(searchQuery.toLowerCase()),
                )
                .map((u) => (
                  <button
                    key={u._id}
                    className='w-full text-left p-4 rounded-lg border border-[#D1D7DB] bg-white hover:bg-[#F0F2F5] transition-colors'
                    onClick={() => createChat(u)}
                  >
                    <div className='flex items-center gap-3'>
                      <div className='relative'>
                        <UserCircle className='w-6 h-6 text-[#667781]' />
                        {/* Online Symbol */}
                        {onlineUsers.includes(u._id) && (
                          <span className='absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[#25D366] border-2 border-white' />
                        )}
                      </div>

                      <div className='flex-1 min-w-0'>
                        <span className='font-medium text-[#111B21]'>{u.name}</span>
                        <div className='text-xs text-[#667781] mt-0.5 '>
                          {/* to show online and offline text  */}
                          {onlineUsers.includes(u._id)?"Online" : "Offline"}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
            </div>
          </div>
        ) : chats && chats.length > 0 ? (
          <div className='space-y-2 overflow-y-auto h-full pb-4'>
            {chats.map((chat) => {
              const latestMessage = chat.chat.latestMessage;
              const isSelected = selectedUser === chat.chat._id;

              const isSentByMe = latestMessage?.sender === loggedInUser?._id;
              const unseenCount = chat.chat.unseenCount || 0;

              return (
                <button
                  key={chat.chat._id}
                  onClick={() => handleChatClick(chat.chat._id)}
                  className={`w-full text-left p-4 rounded-lg transition-colors border ${
                    isSelected
                      ? "bg-[#E7FCE3] border-[#25D366]"
                      : "border-transparent hover:bg-[#F0F2F5]"
                  }`}
                >
                  <div className='flex items-center gap-3 '>
                    <div className='relative'>
                      <div className='w-12 h-12 rounded-full bg-[#D1D7DB] flex items-center justify-center'>
                        <UserCircle className='w-7 h-7 text-[#667781]' />
                        {/* Online user */}

                      </div>
                      {onlineUsers.includes(chat.user._id)&& (
                        <span className='absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[#25D366] border-2 border-white' />
                      )}
                    </div>

                    <div className='flex-1 min-w-0'>
                      <div className='flex items-center justify-between mb-1'>
                        <span
                          className={`font-semibold truncate ${
                            isSelected ? "text-[#111B21]" : "text-[#111B21]"
                          }`}
                        >
                          {chat.user.name}
                        </span>
                        {unseenCount > 0 && (
                          <div className='bg-[#25D366] text-white text-xs font-bold rounded-full min-w-[22px] h-5.5 flex items-center justify-center px-2'>
                            {unseenCount > 99 ? "99+" : unseenCount}
                          </div>
                        )}
                      </div>
                      {latestMessage && (
                        <div className='flex items-center gap-2'>
                          {isSentByMe ? (
                            <CornerUpLeft
                              size={14}
                              className='text-[#34B7F1] shrink-0'
                            />
                          ) : (
                            <CornerDownRight
                              size={14}
                              className='text-[#128C7E] shrink-0'
                            />
                          )}
                          <span className='text-sm text-[#667781] truncate flex-1'>
                            {latestMessage.text}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className='flex flex-col items-center justify-center h-full text-center'>
            <div className='p-4 bg-[#F0F2F5] rounded-full mb-4'>
              <MessageCircle className='w-8 h-8 text-[#128C7E]' />
            </div>
            <p className='text-[#111B21] font-medium'>No conversation yet</p>
            <p className='text-sm text-[#667781] mt-1'>
              Start a new chat to begin messaging
            </p>
          </div>
        )}
      </div>

      {/* footer */}
      <div className='p-4 border-t border-[#D1D7DB] space-y-2 bg-white'>
        <Link
          href={"/profile"}
          className='flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-[#F0F2F5] transition-colors'
        >
          <div className='p-1.5 bg-[#D1D7DB] rounded-lg'>
            <UserCircle className='w-4 h-4 text-[#667781]' />
          </div>
          <span className='font-medium text-[#111B21]'>Profile</span>
        </Link>

        <button
          onClick={handleLogout}
          className='w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-[#FDECEC] transition-colors text-[#D9534F]'
        >
          <div className='p-1.5 bg-[#E57373] rounded-lg'>
            <LogOut className='w-4 h-4 text-white' />
          </div>
          <span className='font-medium'>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default ChatSidebar;
