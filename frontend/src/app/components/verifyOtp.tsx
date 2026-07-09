/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import axios from "axios";
import { ArrowRight, ChevronLeft, Loader2, Lock } from "lucide-react";
import { redirect, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Cookies from "js-cookie";
import { useAppData, user_service } from "../context/AppContext";
import Loading from "./Loading";
import toast from "react-hot-toast";

const VerifyOtp = () => {
  const { isAuth, setIsAuth, setUser, loading: userLoading, fetchChats, fetchUsers } = useAppData();
  const [loading, setLoading] = useState<boolean>(false);
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [error, setError] = useState<string>("");
  const [resendLoading, setResendLoading] = useState<boolean>(false);
  const [timer, setTimer] = useState(60);
  const inputRefs = useRef<Array<HTMLElement | null>>([]);
  const router = useRouter();

  const searchParams = useSearchParams();

  const email: string = searchParams.get("email") || "";

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const handleInputChange = (index: number, value: string): void => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError("");

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLElement>,
  ): void => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>): void => {
    e.preventDefault();

    const pasteData = e.clipboardData.getData("text");
    const digits = pasteData.replace(/\D/g, "").slice(0, 6);

    if (digits.length === 6) {
      const newOtp = digits.split("");
      setOtp(newOtp);
      inputRefs.current[5]?.focus();
    }
  };

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    const otpString = otp.join("");
    if (otpString.length !== 6) {
      setError("Please Enter all 6 digits");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const { data } = await axios.post(`${user_service}/api/v1/verify`, {
        email,
        otp: otpString,
      });
      toast.success(data.message);
      Cookies.set("token", data.token, {
        expires: 15,
        secure: false,
        path: "/",
      });
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
      setUser(data.user);
      setIsAuth(true);
      fetchChats();
      fetchUsers();
    } catch (error: any) {
      setError(error.response.data.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setResendLoading(true);
    setError("");
    try {
      const { data } = await axios.post(`${user_service}/api/v1/login`, {
        email,
      });
      toast.success(data.message);
      setTimer(60);
    } catch (error: any) {
      setError(error.response.data.message);
    } finally {
      setResendLoading(false);
    }
  };

  if (userLoading) return <Loading />;
  if (isAuth) redirect("/chat");

  return (
    <div className='min-h-screen bg-[#ECE5DD] flex items-center justify-center p-4'>
      <div className='max-w-md w-full'>
        <div className='bg-white border border-[#D1D7DB] rounded-lg p-8 shadow-lg'>
          <div className='text-center mb-8 relative'>
            <button
              className='absolute top-0 left-0 p-2 text-[#667781] hover:text-[#111B21]'
              onClick={() => router.push("/login")}
            >
              <ChevronLeft className='w-6 h-6' />
            </button>
            <div className='mx-auto w-20 h-20 bg-[#075E54] rounded-lg flex items-center justify-center mb-6'>
              <Lock size={40} className='text-white' />
            </div>
            <h1 className='text-4xl font-bold text-[#111B21] mb-3'>
              Verify Your Email
            </h1>
            <p className='text-[#667781] text-lg'>
              we have sent a 6-digit code to &nbsp;
              {email}
            </p>
          </div>
          <form onSubmit={handleSubmit} className='space-y-6'>
            <div>
              <label
                htmlFor='email'
                className='block text-sm font-medium text-[#667781] mb-4 text-center'
              >
                Enter Your 6 digit otp here
              </label>
              <div className='flex justify-center items-center space-x-3'>
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el: HTMLInputElement | null) => {
                      inputRefs.current[idx] = el;
                    }}
                    type='text'
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleInputChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    onPaste={idx === 0 ? handlePaste : undefined}
                    className='w-12 h-12 text-center text-xl font-bold border-2 border-[#D1D7DB] rounded-lg bg-[#F0F2F5] text-[#111B21] focus:outline-none focus:border-[#128C7E]'
                  />
                ))}
              </div>
            </div>
            {error && (
              <div className='bg-[#FDECEC] border border-[#E57373] rounded-lg p-3'>
                <p className='text-[#D9534F] text-sm text-center'>{error}</p>
              </div>
            )}
            <button
              type='submit'
              className='w-full bg-[#25D366] text-white py-4 px-6 rounded-lg font-semibold hover:bg-[#20BD5A] disabled:opacity-50 disabled:cursor-not-allowed'
              disabled={loading}
            >
              {loading ? (
                <div className='flex items-center justify-center gap-2'>
                  <Loader2 className='w-5 h-5' />
                  Verifying...
                </div>
              ) : (
                <div className='flex items-center justify-center gap-2'>
                  <span>Verify</span>
                  <ArrowRight className='w-5 h-5' />
                </div>
              )}
            </button>
          </form>

          <div className='mt-6 text-center'>
            <p className='text-[#667781] text-sm mb-4'>
              Didn&apos;t recive the code
            </p>
            {timer > 0 ? (
              <p className='text-[#667781] text-sm'> Resend code in {timer}s </p>
            ) : (
              <button
                className='text-[#128C7E] hover:text-[#075E54] font-medium text-sm disabled:opacity-50'
                disabled={resendLoading}
                onClick={handleResendOtp}
              >
                {resendLoading ? "Sending" : "Resend Code"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyOtp;
