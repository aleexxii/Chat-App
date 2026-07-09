/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import axios from "axios";
import { ArrowRight, Loader2, Mail } from "lucide-react";
import { redirect, useRouter } from "next/navigation";
import { useState } from "react";
import { useAppData, user_service } from "../context/AppContext";
import Loading from "../components/Loading";
import toast from "react-hot-toast";

function LoginPage() {
  const [email, setEmail] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();

  const { isAuth, loading:userLoading} = useAppData()

  const handleSubmit = async (e: React.SubmitEvent): Promise<void> => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await axios.post(
        `${user_service}/api/v1/login`,
        {email}
      );
      toast.success(data.message);
      router.push(`/verify?email=${email}`);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  if(userLoading) return <Loading />
  if(isAuth) redirect('/chat')

  return (
    <div className='min-h-screen bg-[#ECE5DD] flex items-center justify-center p-4'>
      <div className='max-w-md w-full'>
        <div className='bg-white border border-[#D1D7DB] rounded-lg p-8 shadow-lg'>
          <div className='text-center mb-8'>
            <div className='mx-auto w-20 h-20 bg-[#075E54] rounded-lg flex items-center justify-center mb-6'>
              <Mail size={40} className='text-white' />
            </div>
            <h1 className='text-4xl font-bold text-[#111B21] mb-3'>
              Welcome To Chat App
            </h1>
            <p className='text-[#667781] text-lg'>
              Enter your email to continue your journey
            </p>
          </div>
          <form onSubmit={handleSubmit} className='space-y-6'>
            <div>
              <label
                htmlFor='email'
                className='block text-sm font-medium text-[#667781] mb-2'
              >
                Email Address
              </label>
              <input
                type='email'
                id='email'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className='w-full px-4 py-4 bg-[#F0F2F5] border border-[#D1D7DB] rounded-lg text-[#111B21] placeholder-[#667781] focus:outline-none focus:border-[#128C7E]'
                placeholder='Enter your email address'
                required
              />
            </div>
            <button
              type='submit'
              className='w-full bg-[#25D366] text-white py-4 px-6 rounded-lg font-semibold hover:bg-[#20BD5A] disabled:opacity-50 disabled:cursor-not-allowed'
              disabled={loading}
            >
              {loading ? (
                <div className='flex items-center justify-center gap-2'>
                  <Loader2 className='w-5 h-5' />
                  Sending Otp to your mail...
                </div>
              ) : (
                <div className='flex items-center justify-center gap-2'>
                  <span>Send Verification Code</span>
                  <ArrowRight className='w-5 h-5' />
                </div>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
