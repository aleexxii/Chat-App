import { Menu, UserCircle } from "lucide-react";
import { User } from "../context/AppContext";

interface ChatHeaderProps {
  user: User | null;
  setSidebarOpen: (open: boolean) => void;
  isTyping: boolean;
  onlineUsers: string[];
}

function ChatHeader({
  user,
  setSidebarOpen,
  isTyping,
  onlineUsers,
}: ChatHeaderProps) {
  const isOnlineUser = user && onlineUsers.includes(user._id);
  return (
    <>
      {/* Mobile menu toggle */}
      <div className='sm:hidden fixed top-4 right-4 z-30'>
        <button
          className='p-3 bg-[#075E54] rounded-lg hover:bg-[#128C7E] transition-colors shadow-md'
          onClick={() => setSidebarOpen(true)}
        >
          <Menu className='w-5 h-5 text-white' />
        </button>
      </div>

      {/* chat header */}
          {user ? (
            <>
      <div className='bg-[#075E54] border-b border-[#064C44] p-4 md:p-6'>
        <div className='flex items-center gap-4'>
              <div className='relative'>
                <div className='w-14 h-14 rounded-full bg-[#D1D7DB] flex items-center justify-center'>
                  <UserCircle className='w-8 h-8 text-[#667781]' />
                </div>
                {/* Online user setup */}
                {isOnlineUser && (
                  <span className='absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#25D366] border-2 border-[#075E54]'>
                    <span className='absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-75'></span>
                  </span>
                )}
              </div>
              {/* User info */}
              <div className='flex-1 min-w-0'>
                <div className='flex items-center gap-3 mb-1'>
                  <h2 className='text-2xl font-bold text-white truncate'>
                    {user.name}
                  </h2>
                </div>
                <div className='flex items-center gap-2'>
                  {isTyping ? (
                    <div className='flex items-center gap-2 text-sm'>
                      <div className='flex gap-1'>
                        <div className='w-1.5 h-1.5 bg-[#25D366] rounded-full animate-bounce'></div>
                        <div
                          className='w-1.5 h-1.5 bg-[#25D366] rounded-full animate-bounce'
                          style={{ animationDelay: "0.1" }}
                        ></div>
                        <div
                          className='w-1.5 h-1.5 bg-[#25D366] rounded-full animate-bounce'
                          style={{ animationDelay: "0.2" }}
                        ></div>
                      </div>
                      <span className='text-[#DCF8C6] font-medium'>
                        typing...
                      </span>
                    </div>
                  ) : (
                    <div className='flex items-center gap-2'>
                      <div
                        className={`w-2 h-2 rounded-full ${isOnlineUser ? "bg-[#25D366]" : "bg-[#B7C4C9]"}`}
                      ></div>
                      <span
                        className={`text-sm font-medium ${
                          isOnlineUser ? "text-[#DCF8C6]" : "text-[#B7C4C9]"
                        }`}
                      >
                        {isOnlineUser ? "online" : "offline"}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* to show typing status */}
        </div>
      </div>
            </>
          ) : (
            <div className='h-screen flex justify-center items-center gap-4'>
              <div className='w-14 h-14 rounded-full bg-[#D1D7DB] flex items-center justify-center'>
                <UserCircle className='w-8 h-8 text-[#667781]' />
              </div>
              <div className=''>
                <h2 className='text-2xl font-bold text-white'>
                  Select a conversation
                </h2>
                <p className='text-sm text-[#888888] mt-1'>
                  Choose a chat from the sidebar to start messaging
                </p>
              </div>
            </div>
          )}
    </>
  );
}

export default ChatHeader;
