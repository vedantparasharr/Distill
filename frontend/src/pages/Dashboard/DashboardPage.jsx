import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import progressService from "../../services/progressService";
import { formatDate } from "../../utils/formatters";
import {
  EmptyState,
  ErrorState,
  InlineLinkButton,
  LoadingState,
  PageShell,
  SectionCard,
  StatCard,
  StatusBadge,
} from "../../components/common/ui";

const DashboardPage = () => {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await progressService.getDashboardData();
        setDashboard(response.data);
      } catch (requestError) {
        setError(requestError.error || requestError.message || "Unable to load dashboard");
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  if (loading) {
    return <LoadingState label="Loading dashboard" />;
  }

  if (error) {
    return <ErrorState description={error} />;
  }

  const overview = dashboard?.overview;
  const recentDocuments = dashboard?.recentActivity?.documents || [];
  const recentQuizzes = dashboard?.recentActivity?.quizzes || [];

  return (
    <PageShell
      title="Dashboard"
      description="Track revision activity, recent uploads, and assessment performance from one place."
      actions={<InlineLinkButton to="/documents">Manage documents</InlineLinkButton>}
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Documents" value={overview?.totalDocuments || 0} hint="Uploaded source files" />
        <StatCard label="Flashcards" value={overview?.totalFlashcards || 0} hint={`${overview?.totalFlashcardSets || 0} sets created`} />
        <StatCard label="Quizzes" value={overview?.totalQuizzes || 0} hint={`${overview?.completedQuizzes || 0} completed`} />
        <StatCard label="Average score" value={`${overview?.averageScore || 0}%`} hint={`Study streak: ${overview?.studyStreak || 0} days`} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <SectionCard title="Recent documents" description="Your latest uploads and their processing state.">
          {recentDocuments.length === 0 ? (
            <EmptyState
              compact
              title="No documents yet"
              description="Upload your first PDF to start generating summaries, flashcards, and quizzes."
              action={<InlineLinkButton to="/documents">Upload a document</InlineLinkButton>}
            />
          ) : (
            <div className="space-y-3">
              {recentDocuments.map((document) => (
                <Link
                  key={document._id}
                  to={`/documents/${document._id}`}
                  className="flex flex-col gap-3 rounded-3xl border border-slate-200 p-4 transition hover:border-slate-300 hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <h3 className="font-semibold tracking-tight text-slate-950">{document.title}</h3>
                    <p className="mt-1 text-sm text-slate-600">{document.fileName}</p>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <StatusBadge status={document.status} />
                    <span>{formatDate(document.lastAccessed, { withTime: true })}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title="Recent quizzes" description="Jump back into your latest assessments.">
          {recentQuizzes.length === 0 ? (
            <EmptyState
              compact
              title="No quizzes available"
              description="Generate a quiz from any ready document to start testing your understanding."
            />
          ) : (
            <div className="space-y-3">
              {recentQuizzes.map((quiz) => (
                <div key={quiz._id} className="rounded-3xl border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold tracking-tight text-slate-950">{quiz.title}</h3>
                      <p className="mt-1 text-sm text-slate-600">{quiz.documentId?.title || "Untitled document"}</p>
                    </div>
                    <span className="text-sm font-semibold text-slate-700">{quiz.score || 0}%</span>
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-3 text-sm text-slate-600">
                    <span>{quiz.totalQuestions} questions</span>
                    <Link
                      to={quiz.completedAt ? `/quizzes/${quiz._id}/results` : `/quizzes/${quiz._id}`}
                      className="font-semibold text-slate-950 underline decoration-orange-300 underline-offset-4"
                    >
                      {quiz.completedAt ? "View results" : "Continue quiz"}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </PageShell>
  );
};

export default DashboardPage;