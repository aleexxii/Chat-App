/* eslint-disable @typescript-eslint/no-explicit-any */
import { Loader2, Paperclip, Send, X } from "lucide-react";
import { useState } from "react";

interface MessageInputProps {
  selectedUser: string | null;
  message: string;
  setMessage: (message: string) => void;
  handleMessageSend: (e: any, imageFile?: File | null) => void;
}

const MessageInput = ({
  selectedUser,
  message,
  setMessage,
  handleMessageSend,
}: MessageInputProps) => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!message.trim() && !imageFile) return;

    setIsUploading(true);
    await handleMessageSend(e, imageFile);
    setImageFile(null);
    setIsUploading(false);
  };

  if (!selectedUser) return null;
  return (
      <form
        onSubmit={handleSubmit}
        className='flex flex-col gap-2 border-t border-[#D1D7DB] bg-[#F0F2F5] p-3'
      >
        {imageFile && (
          <div className='relative w-fit'>
            <img
              src={URL.createObjectURL(imageFile)}
              alt='preview'
              className='w-24 h-24 object-cover rounded-lg border border-[#D1D7DB]'
            />
            <button
              type='button'
              className='absolute -top-2 -right-2 bg-[#111B21] rounded-full p-1'
              onClick={() => setImageFile(null)}
            >
              <X className='w-4 h-4 text-white' />
            </button>
          </div>
        )}
        <div className='flex items-center gap-2 '>
          <label className='cursor-pointer bg-white hover:bg-[#E9ECEF] rounded-full px-3 py-2 transition-colors'>
            <Paperclip size={18} className='text-[#667781]' />
            <input
              type='file'
              accept='image/*'
              className='hidden'
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file && file.type.startsWith("image/")) {
                  setImageFile(file);
                }
              }}
            />
</label>
            <input
              type='text'
              className='flex-1 bg-white rounded-full px-4 py-2 text-[#111B21] placeholder-[#667781] focus:outline-none'
              placeholder={imageFile ? "Add a caption..." : "Type a message"}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          
          <button
            type='submit'
            disabled={(!imageFile && !message) || isUploading}
            className='bg-[#25D366] hover:bg-[#20BD5A] px-4 py-2 rounded-full flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed text-white'
          >
            {
              isUploading? (<Loader2 className="w-4 h-4 animate-spin" />) : (<Send className="w-4 h-4 " />)
            }
          </button>
        </div>
      </form>
  );
};

export default MessageInput;
