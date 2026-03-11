import { Link } from "react-router-dom";

export const PageShell = ({ title, description, actions, children }) => (
  <div className="space-y-6">
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
          AI Learning Assistant
        </p>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              {description}
            </p>
          ) : null}
        </div>
      </div>
      {actions ? <div className="flex w-full flex-wrap gap-3 lg:w-auto">{actions}</div> : null}
    </div>
    {children}
  </div>
);

export const SectionCard = ({ title, description, action, children, className = "" }) => (
  <section
    className={`overflow-hidden rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_18px_45px_-30px_rgba(15,23,42,0.45)] sm:p-5 ${className}`.trim()}
  >
    {(title || description || action) && (
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          {title ? (
            <h2 className="text-lg font-semibold tracking-tight text-slate-900">
              {title}
            </h2>
          ) : null}
          {description ? (
            <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    )}
    {children}
  </section>
);

export const StatCard = ({ label, value, hint }) => (
  <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_18px_45px_-30px_rgba(15,23,42,0.45)]">
    <p className="text-sm text-slate-500">{label}</p>
    <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{value}</p>
    {hint ? <p className="mt-2 text-sm text-slate-600">{hint}</p> : null}
  </div>
);

export const StatusBadge = ({ status }) => {
  const toneMap = {
    ready: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    processing: "bg-amber-50 text-amber-700 ring-amber-200",
    failed: "bg-rose-50 text-rose-700 ring-rose-200",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ring-1 ${toneMap[status] || "bg-slate-100 text-slate-700 ring-slate-200"}`}
    >
      {status}
    </span>
  );
};

export const EmptyState = ({
  title,
  description,
  action,
  compact = false,
}) => (
  <div
    className={`rounded-3xl border border-dashed border-slate-300 bg-slate-50/80 text-center ${compact ? "p-6" : "p-10"}`}
  >
    <h3 className="text-lg font-semibold tracking-tight text-slate-900">{title}</h3>
    <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-600">
      {description}
    </p>
    {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
  </div>
);

export const LoadingState = ({ label = "Loading", fullScreen = false }) => (
  <div
    className={`flex items-center justify-center ${fullScreen ? "min-h-screen" : "min-h-60"}`}
  >
    <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 shadow-sm">
      <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-orange-500" />
      {label}
    </div>
  </div>
);

export const ErrorState = ({ title = "Something went wrong", description, action }) => (
  <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-rose-950">
    <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
    {description ? <p className="mt-2 text-sm leading-6">{description}</p> : null}
    {action ? <div className="mt-4">{action}</div> : null}
  </div>
);

export const PrimaryButton = ({ className = "", children, ...props }) => (
  <button
    className={`inline-flex items-center justify-center rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 ${className}`.trim()}
    {...props}
  >
    {children}
  </button>
);

export const SecondaryButton = ({ className = "", children, ...props }) => (
  <button
    className={`inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-60 ${className}`.trim()}
    {...props}
  >
    {children}
  </button>
);

export const InlineLinkButton = ({ to, children }) => (
  <Link
    to={to}
    className="inline-flex items-center rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-950"
  >
    {children}
  </Link>
);