import { useState } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import authService from "../../services/authService";

const RegisterPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (form.password !== form.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setSubmitting(true);

    try {
      const response = await authService.register(
        form.username,
        form.email,
        form.password,
      );
      toast.success(response.message || "OTP sent to your email");
      navigate(`/verify-email?email=${encodeURIComponent(form.email)}`, {
        replace: true,
      });
    } catch (error) {
      toast.error(error.error || error.message || "Unable to create account");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,rgba(255,147,36,0.18),transparent_35%),linear-gradient(180deg,#fffdf6_0%,#f8fafc_50%,#eef2ff_100%)] px-4 py-10">
      <div className="grid w-full max-w-5xl gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-4xl border border-white/70 bg-white/80 p-8 shadow-[0_28px_80px_-40px_rgba(15,23,42,0.35)] backdrop-blur lg:p-12">
          <p className="text-sm font-semibold uppercase tracking-[0.36em] text-orange-500">
            Start here
          </p>
          <h1 className="mt-6 max-w-lg text-4xl font-semibold tracking-tight text-slate-950">
            Build a private study workspace around your own documents.
          </h1>
          <p className="mt-5 max-w-xl text-sm leading-7 text-slate-600">
            Upload PDFs, generate revision material, and keep your progress organized without leaving the app.
          </p>
        </section>

        <section className="rounded-4xl border border-white/70 bg-slate-950 p-8 text-white shadow-[0_28px_80px_-40px_rgba(15,23,42,0.85)] lg:p-10">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-orange-300">
              Register
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">
              Create your account
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {[
              ["username", "Username", "text", "Your display name"],
              ["email", "Email", "email", "you@example.com"],
              ["password", "Password", "password", "At least 6 characters"],
              ["confirmPassword", "Confirm password", "password", "Re-enter your password"],
            ].map(([name, label, type, placeholder]) => (
              <label key={name} className="block space-y-2">
                <span className="text-sm font-medium text-slate-200">{label}</span>
                <input
                  type={type}
                  value={form[name]}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, [name]: event.target.value }))
                  }
                  className="w-full rounded-2xl border border-slate-700 bg-slate-900/60 px-4 py-3 text-sm text-white outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-500/15"
                  placeholder={placeholder}
                  required
                />
              </label>
            ))}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-2xl bg-orange-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Creating account..." : "Create account"}
            </button>
          </form>

          <p className="mt-6 text-sm text-slate-300">
            Already registered?{" "}
            <Link to="/login" className="font-semibold text-white underline decoration-orange-300 underline-offset-4">
              Sign in instead
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
};

export default RegisterPage;