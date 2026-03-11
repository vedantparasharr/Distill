import { Link } from "react-router-dom";

const NotFoundPage = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,rgba(255,147,36,0.18),transparent_35%),linear-gradient(180deg,#fffdf5_0%,#f8fafc_100%)] px-4">
      <div className="w-full max-w-xl rounded-4xl border border-white/70 bg-white/90 p-10 text-center shadow-[0_24px_60px_-35px_rgba(15,23,42,0.35)] backdrop-blur">
        <p className="text-sm font-semibold uppercase tracking-[0.32em] text-orange-500">
          Error 404
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950">
          That page does not exist.
        </h1>
        <p className="mt-4 text-sm leading-7 text-slate-600">
          The route may be outdated, or the page has not been generated for this resource.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link
            to="/dashboard"
            className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Go to dashboard
          </Link>
          <Link
            to="/documents"
            className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-950"
          >
            Browse documents
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;