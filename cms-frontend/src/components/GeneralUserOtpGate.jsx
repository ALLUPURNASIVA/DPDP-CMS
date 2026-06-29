import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useAuth0 } from "@auth0/auth0-react";
import { getSecureClient } from "../api";

export default function GeneralUserOtpGate({ children }) {
  const { user, getAccessTokenSilently, logout } = useAuth0();

  const [checking, setChecking] = useState(true);
  const [verified, setVerified] = useState(false);
  const [otp, setOtp] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [otpSent, setOtpSent] = useState(false);

  useEffect(() => {
    checkOtpStatus();
  }, []);

  useEffect(() => {
    if (resendTimer <= 0) return;

    const timer = setInterval(() => {
      setResendTimer((prev) => Math.max(prev - 1, 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [resendTimer]);

  const checkOtpStatus = async () => {
    try {
      const api = await getSecureClient(getAccessTokenSilently);
      const res = await api.get("/user-otp/status");
      setVerified(Boolean(res.data.verified));
    } catch {
      setVerified(false);
    } finally {
      setChecking(false);
    }
  };

  const sendOtp = async () => {
    if (resendTimer > 0) return;

    setSending(true);

    try {
      const api = await getSecureClient(getAccessTokenSilently);
      await api.post("/user-otp/send", { email: user?.email });

      setOtpSent(true);
      setResendTimer(30);
      toast.success("OTP sent to your email.");
    } catch (error) {
      toast.error(error.response?.data?.error || "Could not send OTP.");
    } finally {
      setSending(false);
    }
  };

  const verifyOtp = async (event) => {
    event.preventDefault();
    if (otp.length !== 6) return;

    setVerifying(true);

    try {
      const api = await getSecureClient(getAccessTokenSilently);
      await api.post("/user-otp/verify", { otp, email: user?.email });

      setVerified(true);
      toast.success("OTP verified.");
    } catch (error) {
      toast.error(error.response?.data?.error || "Invalid OTP.");
    } finally {
      setVerifying(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-sm font-medium text-slate-500">
          Checking verification status...
        </p>
      </div>
    );
  }

  if (verified) return children;

  return (
    <div className="min-h-[calc(100vh-220px)] flex items-center justify-center px-4">
      <div className="w-full max-w-[360px] rounded-2xl border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.08)] overflow-hidden">
        <div className="px-6 pt-6 pb-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-slate-900 text-white flex items-center justify-center">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>

            <div>
              <h2 className="text-lg font-extrabold text-slate-950">
                Verify sign up
              </h2>
              <p className="text-xs font-medium text-slate-500">
                One-time email confirmation
              </p>
            </div>
          </div>

          <p className="mt-5 text-sm leading-6 text-slate-600">
            Enter the 6-digit OTP sent to your registered email to continue.
          </p>

          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
              Registered email
            </p>
            <p className="mt-1 truncate text-sm font-bold text-slate-800">
              {user?.email}
            </p>
          </div>
        </div>

        <div className="border-t border-slate-100 px-6 py-5">
          <form onSubmit={verifyOtp}>
            <input
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="Enter OTP"
              inputMode="numeric"
              autoComplete="one-time-code"
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-center text-lg font-extrabold tracking-[0.32em] text-slate-950 outline-none transition placeholder:tracking-normal placeholder:text-sm placeholder:font-semibold placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />

            <button
              type="submit"
              disabled={verifying || otp.length !== 6}
              className="mt-3 w-full rounded-xl bg-blue-600 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
            >
              {verifying ? "Verifying..." : "Verify and continue"}
            </button>
          </form>

          <div className="mt-4 flex items-center justify-between">
            <button
              type="button"
              onClick={sendOtp}
              disabled={sending || resendTimer > 0}
              className="text-sm font-extrabold text-blue-600 transition hover:text-blue-700 disabled:cursor-not-allowed disabled:text-slate-400"
            >
              {sending
                ? "Sending..."
                : resendTimer > 0
                  ? `Resend in ${resendTimer}s`
                  : otpSent
                    ? "Resend OTP"
                    : "Send OTP"}
            </button>

            <button
              type="button"
              onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
              className="text-sm font-bold text-slate-500 transition hover:text-slate-900"
            >
              Log out
            </button>
          </div>

          {otpSent && (
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5">
              <span className="mt-0.5 h-2 w-2 rounded-full bg-emerald-500" />
              <p className="text-xs font-semibold leading-5 text-emerald-800">
                OTP sent successfully. Please check your inbox.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}