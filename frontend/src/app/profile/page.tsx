"use client";

import { useState, FormEvent, useEffect } from "react";
import { useAppData, user_service } from "../context/AppContext";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import axios from "axios";
import { toast } from "react-hot-toast";
import Loading from "../components/Loading";
import { ArrowLeft, Save, UserCircle, Edit2 } from "lucide-react";
import { getErrorMessage } from "../utils/getErrorMessage";

const ProfilePage = () => {
  const { user, isAuth, loading, setUser } = useAppData();
  const [isEdit, setIsEdit] = useState(false);
  const [name, setName] = useState<string | undefined>(user?.name || "");

  const router = useRouter();

  const editHandler = () => {
    setIsEdit(!isEdit);
    setName(user?.name || "");
  };

  const submitHandler = async (e: FormEvent) => {
    e.preventDefault();
    const token = Cookies.get("token");
    try {
      const { data } = await axios.post(
        `${user_service}/api/v1/update/user`,
        { name },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (data?.token) {
        Cookies.set("token", data.token, {
          expires: 15,
          secure: false,
          path: "/",
        });
      }

      toast.success(data?.message || "Profile updated successfully");
      setUser(data?.user);
      setIsEdit(false);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    }
  };

  useEffect(() => {
    if (!isAuth && !loading) {
      router.push("/login");
    }
  }, [isAuth, loading, router]);

  if (loading) return <Loading />;

  return (
    <div className='min-h-screen bg-[#ECE5DD] p-4 md:p-6'>
      <div className='max-w-2xl mx-auto pt-4 md:pt-8'>
        <div className='flex items-center gap-3 mb-5'>
          <button
            onClick={() => router.push("/chat")}
            className='flex h-10 w-10 items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white transition'
          >
            <ArrowLeft className='w-5 h-5' />
          </button>
          <div>
            <h2 className='text-xl font-semibold text-[#111B21]'>Profile</h2>
            <p className='text-sm text-[#667781]'>Manage your WhatsApp profile</p>
          </div>
        </div>

        <div className='overflow-hidden rounded-2xl border border-[#D1D7DB] bg-white shadow-lg'>
          <div className='bg-[#075E54] px-6 py-8 md:px-8'>
            <div className='flex items-center gap-5'>
              <div className='relative'>
                <div className='flex h-24 w-24 items-center justify-center rounded-full bg-[#25D366] shadow-md'>
                  <UserCircle className='h-14 w-14 text-white' />
                </div>
                <div className='absolute -bottom-1 -right-1 h-6 w-6 rounded-full border-2 border-white bg-[#25D366]'></div>
              </div>

              <div className='flex-1'>
                <h2 className='text-2xl font-semibold text-white'>
                  {user?.name || 'Your Name'}
                </h2>
                <p className='mt-1 text-sm text-[#DCF8C6]'>Active now</p>
              </div>
            </div>
          </div>

          <div className='p-6 md:p-8'>
            <div className='rounded-xl border border-[#D1D7DB] bg-[#F0F2F5] p-4'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-xs uppercase tracking-wide text-[#667781]'>
                    Display Name
                  </p>
                  <p className='mt-1 text-[15px] font-medium text-[#111B21]'>
                    {user?.name || 'No name set'}
                  </p>
                </div>

                {!isEdit && (
                  <button
                    onClick={editHandler}
                    className='flex items-center gap-2 rounded-full bg-[#128C7E] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#075E54]'
                  >
                    <Edit2 className='h-4 w-4' />
                    Edit
                  </button>
                )}
              </div>

              {isEdit && (
                <form onSubmit={submitHandler} className='mt-4 space-y-4'>
                  <div className='relative'>
                    <input
                      type='text'
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className='w-full rounded-lg border border-[#D1D7DB] bg-white px-4 py-3 text-[#111B21] outline-none ring-0 placeholder:text-[#667781]'
                      placeholder='Enter your name'
                    />
                  </div>

                  <div className='flex flex-wrap gap-3'>
                    <button
                      type='submit'
                      className='flex items-center gap-2 rounded-lg bg-[#25D366] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#128C7E]'
                    >
                      <Save className='h-4 w-4' />
                      Save Changes
                    </button>

                    <button
                      type='button'
                      onClick={editHandler}
                      className='rounded-lg bg-[#F0F2F5] px-5 py-2.5 text-sm font-semibold text-[#111B21] transition hover:bg-[#E9ECEF]'
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>

            <div className='mt-5 rounded-xl border border-[#D1D7DB] bg-white p-4'>
              <p className='text-sm text-[#667781]'>
                Your profile is synced with your account and will appear in chats.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
