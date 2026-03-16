import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import authService from "../../services/authService";

const RESEND_COOLDOWN_SECONDS = 30;

const getCooldownStorageKey = (email) => `otp-resend-cooldown-until:${(email || "").toLowerCase()}`;

const getRemainingCooldown = (email) => {
  if (typeof window === "undefined" || !email) {
    return 0;
  }

  const until = Number(localStorage.getItem(getCooldownStorageKey(email)));
  if (!until || Number.isNaN(until)) {
    return 0;
  }

  const remaining = Math.ceil((until - Date.now()) / 1000);
  if (remaining <= 0) {
    localStorage.removeItem(getCooldownStorageKey(email));
    return 0;
  }

  return remaining;
};

const formatSeconds = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, "0")}`;
};

const VerifyEmailPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();

  const email = useMemo(() => {
    const queryParams = new URLSearchParams(location.search);
    return queryParams.get("email") || "";
  }, [location.search]);

  const [otp, setOtp] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(() => getRemainingCooldown(email));

  useEffect(() => {
    setCooldown(getRemainingCooldown(email));
  }, [email]);

  useEffect(() => {
    if (cooldown <= 0) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setCooldown((current) => (current <= 1 ? 0 : current - 1));
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [cooldown]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!email) {
      toast.error("Missing email. Please register again.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await authService.verifyEmail(email, otp);
      login(response.data.user);
      toast.success(response.message || "Email verified successfully");
      navigate("/dashboard", { replace: true });
    } catch (error) {
      toast.error(error.error || error.message || "Verification failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    if (!email) {
      toast.error("Missing email. Please register again.");
      return;
    }

    setResending(true);
    try {
      const response = await authService.resendOtp(email);
      toast.success(response.message || "OTP sent again");
      if (typeof window !== "undefined") {
        localStorage.setItem(
          getCooldownStorageKey(email),
          String(Date.now() + RESEND_COOLDOWN_SECONDS * 1000),
        );
      }
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (error) {
      toast.error(error.error || error.message || "Unable to resend OTP");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,rgba(255,147,36,0.18),transparent_35%),linear-gradient(180deg,#fffdf6_0%,#f8fafc_50%,#eef2ff_100%)] px-4 py-10">
      <section className="w-full max-w-md rounded-4xl border border-white/70 bg-white/90 p-8 shadow-[0_28px_80px_-40px_rgba(15,23,42,0.35)] backdrop-blur lg:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-orange-500">
          Verify
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
          Confirm your email
        </h1>
        <p className="mt-3 text-sm text-slate-600">
          Enter the 6-digit OTP sent to <span className="font-semibold">{email || "your email"}</span>.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">One-time password</span>
            <input
              type="text"
              inputMode="numeric"
              value={otp}
              onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-center text-lg tracking-[0.35em] text-slate-950 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
              placeholder="123456"
              required
            />
          </label>

          <button
            type="submit"
            disabled={submitting || otp.length !== 6}
            className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Verifying..." : "Verify email"}
          </button>
        </form>

        <button
          type="button"
          onClick={handleResendOtp}
          disabled={resending || cooldown > 0}
          className="mt-3 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {resending
            ? "Sending..."
            : cooldown > 0
              ? `Resend in ${formatSeconds(cooldown)}`
              : "Resend OTP"}
        </button>

        <p className="mt-6 text-sm text-slate-600">
          Back to{" "}
          <Link to="/login" className="font-semibold text-slate-950 underline decoration-orange-300 underline-offset-4">
            login
          </Link>
        </p>
      </section>
    </div>
  );
};

export default VerifyEmailPage;
