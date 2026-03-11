import { useState } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import authService from "../../services/authService";

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      const response = await authService.login(form.email, form.password);
      login(response.data.user);
      toast.success(response.message || "Logged in successfully");
      navigate("/dashboard", { replace: true });
    } catch (error) {
      toast.error(error.error || error.message || "Unable to log in");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,rgba(255,147,36,0.18),transparent_35%),linear-gradient(180deg,#fffdf6_0%,#f8fafc_50%,#eef2ff_100%)] px-4 py-10">
      <div className="grid w-full max-w-5xl gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-4xl border border-white/70 bg-slate-950 p-8 text-white shadow-[0_28px_80px_-40px_rgba(15,23,42,0.85)] lg:p-12">
          <p className="text-sm font-semibold uppercase tracking-[0.36em] text-orange-300">
            Welcome back
          </p>
          <h1 className="mt-6 max-w-lg text-4xl font-semibold tracking-tight">
            Study your documents with generated summaries, flashcards, and quizzes.
          </h1>
          <p className="mt-5 max-w-xl text-sm leading-7 text-slate-300">
            Sign in to upload source material, ask document-grounded AI questions, and keep your revision progress in one place.
          </p>
        </section>

        <section className="rounded-4xl border border-white/70 bg-white/90 p-8 shadow-[0_28px_80px_-40px_rgba(15,23,42,0.35)] backdrop-blur lg:p-10">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-orange-500">
              Login
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
              Continue your study session
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">Email</span>
              <input
                type="email"
                value={form.email}
                onChange={(event) =>
                  setForm((current) => ({ ...current, email: event.target.value }))
                }
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                placeholder="you@example.com"
                required
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">Password</span>
              <input
                type="password"
                value={form.password}
                onChange={(event) =>
                  setForm((current) => ({ ...current, password: event.target.value }))
                }
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                placeholder="Enter your password"
                required
              />
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="mt-6 text-sm text-slate-600">
            New here?{" "}
            <Link to="/register" className="font-semibold text-slate-950 underline decoration-orange-300 underline-offset-4">
              Create an account
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
};

export default LoginPage;