import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Link, useParams } from "react-router-dom";
import { ArrowUpRight, FileText, Send } from "lucide-react";
import aiService from "../../services/aiService";
import documentService from "../../services/documentService";
import flashcardService from "../../services/flashcardService";
import quizService from "../../services/quizService";
import { formatBytes, formatDate, truncate } from "../../utils/formatters";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PrimaryButton,
  SecondaryButton,
  StatusBadge,
} from "../../components/common/ui";

const TABS = [
  { key: "chat", label: "Chat" },
  { key: "ai", label: "AI Actions" },
  { key: "flashcards", label: "Flashcards" },
  { key: "quizzes", label: "Quizzes" },
];

const md = "prose prose-slate max-w-none prose-headings:tracking-tight prose-p:leading-7 prose-li:leading-7 prose-strong:text-slate-950 prose-sm";

const DocumentDetailPage = () => {
  const { id } = useParams();
  const [doc, setDoc] = useState(null);
  const [flashcardSets, setFlashcardSets] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [summary, setSummary] = useState("");
  const [concept, setConcept] = useState("");
  const [explanation, setExplanation] = useState(null);
  const [chatPrompt, setChatPrompt] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyAction, setBusyAction] = useState("");
  const [activeTab, setActiveTab] = useState("chat");
  const chatBottomRef = useRef(null);

  const loadWorkspace = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const [docRes, fcRes, qRes, chatRes] = await Promise.all([
        documentService.getDocumentById(id),
        flashcardService.getFlashcardsForDocument(id),
        quizService.getQuizzesForDocument(id),
        aiService.getChatHistory(id),
      ]);
      setDoc(docRes.data);
      setFlashcardSets(fcRes.data || []);
      setQuizzes(qRes.data || []);
      setChatMessages(chatRes.data || []);
    } catch (err) {
      setError(err.error || err.message || "Unable to load document workspace");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadWorkspace(); }, [loadWorkspace]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const isReady = doc?.status === "ready";
  const totalCards = useMemo(
    () => flashcardSets.reduce((sum, set) => sum + set.cards.length, 0),
    [flashcardSets],
  );

  const handleGenerateSummary = async () => {
    try {
      setBusyAction("summary");
      const res = await aiService.generateSummary(id);
      setSummary(res.summary);
      toast.success("Summary generated");
    } catch (err) {
      toast.error(err.error || err.message || "Could not generate summary");
    } finally {
      setBusyAction("");
    }
  };

  const handleGenerateFlashcards = async () => {
    try {
      setBusyAction("flashcards");
      const res = await aiService.generateFlashcards(id, { count: 10 });
      setFlashcardSets((c) => [res.data, ...c]);
      toast.success("Flashcards generated");
      setActiveTab("flashcards");
    } catch (err) {
      toast.error(err.error || err.message || "Could not generate flashcards");
    } finally {
      setBusyAction("");
    }
  };

  const handleGenerateQuiz = async () => {
    try {
      setBusyAction("quiz");
      const res = await aiService.generateQuiz(id, {
        numQuestions: 5,
        title: `${doc.title} Quiz`,
      });
      setQuizzes((c) => [res.data, ...c]);
      toast.success("Quiz generated");
      setActiveTab("quizzes");
    } catch (err) {
      toast.error(err.error || err.message || "Could not generate quiz");
    } finally {
      setBusyAction("");
    }
  };

  const handleSendMessage = async () => {
    if (!chatPrompt.trim()) return;
    try {
      setBusyAction("chat");
      const res = await aiService.chat(id, chatPrompt.trim());
      setChatMessages((c) => [
        ...c,
        { role: "user", content: res.data.question, timestamp: new Date().toISOString() },
        { role: "assistant", content: res.data.answer, timestamp: new Date().toISOString() },
      ]);
      setChatPrompt("");
    } catch (err) {
      toast.error(err.error || err.message || "Could not send question");
    } finally {
      setBusyAction("");
    }
  };

  const handleExplainConcept = async () => {
    if (!concept.trim()) return;
    try {
      setBusyAction("explain");
      const res = await aiService.explainConcept(id, concept.trim());
      setExplanation(res);
      toast.success("Concept explained");
    } catch (err) {
      toast.error(err.error || err.message || "Could not explain concept");
    } finally {
      setBusyAction("");
    }
  };

  const handleDeleteQuiz = async (quizId) => {
    if (!window.confirm("Delete this quiz?")) return;
    try {
      await quizService.deleteQuiz(quizId);
      setQuizzes((c) => c.filter((q) => q._id !== quizId));
      toast.success("Quiz deleted");
    } catch (err) {
      toast.error(err.error || err.message || "Could not delete quiz");
    }
  };

  if (loading) return <LoadingState label="Loading document workspace" />;
  if (error) return <ErrorState description={error} action={<SecondaryButton onClick={loadWorkspace}>Try again</SecondaryButton>} />;

  return (
    <div className="flex h-full flex-col gap-0 overflow-x-clip">
      {/* ── Document header ── */}
      <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_18px_45px_-30px_rgba(15,23,42,0.35)] sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-xl font-semibold tracking-tight text-slate-950">{doc.title}</h1>
                <StatusBadge status={doc.status} />
              </div>
              <p className="mt-1 text-sm text-slate-500">
                {doc.fileName} · {formatBytes(doc.fileSize)} · uploaded {formatDate(doc.uploadDate)}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-3">
            <div className="flex gap-3 text-sm text-slate-600">
              <span className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-1.5 font-semibold">
                {totalCards} cards
              </span>
              <span className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-1.5 font-semibold">
                {quizzes.length} quizzes
              </span>
            </div>
            {doc.filePath ? (
              <a
                href={doc.filePath}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-950"
              >
                Open PDF
                <ArrowUpRight className="h-4 w-4" />
              </a>
            ) : null}
          </div>
        </div>

        {!isReady ? (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            AI actions unlock once background processing completes. Refresh to check the status.
          </div>
        ) : null}

        {/* ── Tab bar ── */}
        <div className="mt-5 flex gap-1 overflow-x-auto rounded-2xl border border-slate-200 bg-slate-100 p-1">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              className={`flex min-w-[108px] flex-1 items-center justify-center rounded-xl px-3 py-2 text-sm font-semibold transition sm:min-w-0 ${
                activeTab === key
                  ? "bg-white text-slate-950 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab: Chat ── */}
      {activeTab === "chat" && (
        <div className="flex flex-1 flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_18px_45px_-30px_rgba(15,23,42,0.35)] sm:p-5">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-slate-950">Document chat</h2>
            <p className="mt-1 text-sm text-slate-500">Ask specific questions grounded in this document's content.</p>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto rounded-2xl bg-slate-50 p-3 sm:p-4" style={{ minHeight: 220, maxHeight: 480 }}>
            {chatMessages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 py-10 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-200 text-slate-500">
                  <Send className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-slate-700">No messages yet</p>
                  <p className="mt-1 text-sm text-slate-500">Type a question below to start the conversation.</p>
                </div>
              </div>
            ) : (
              chatMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[82%] rounded-3xl px-4 py-3 text-sm leading-7 ${
                      msg.role === "user"
                        ? "bg-slate-950 text-white"
                        : "border border-slate-200 bg-white text-slate-800"
                    }`}
                  >
                    {msg.role === "assistant" ? (
                      <div className={md}>
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      msg.content
                    )}
                  </div>
                </div>
              ))
            )}
            <div ref={chatBottomRef} />
          </div>

          <div className="flex items-stretch gap-3">
            <input
              value={chatPrompt}
              onChange={(e) => setChatPrompt(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
              placeholder="Ask a question about this document…"
              disabled={!isReady || busyAction === "chat"}
              className="min-w-0 flex-1 rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100 disabled:cursor-not-allowed disabled:opacity-60"
            />
            <PrimaryButton
              type="button"
              onClick={handleSendMessage}
              disabled={!isReady || busyAction === "chat" || !chatPrompt.trim()}
              className="aspect-square !px-0 !py-0 h-[46px] w-[46px]"
            >
              <Send className="h-4 w-4" />
            </PrimaryButton>
          </div>
        </div>
      )}

      {/* ── Tab: AI Actions ── */}
      {activeTab === "ai" && (
        <div className="space-y-4">
          {/* Generate row */}
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              {
                label: "Summary",
                description: "Get a concise overview of the entire document.",
                action: "summary",
                buttonLabel: busyAction === "summary" ? "Generating…" : "Generate summary",
                handler: handleGenerateSummary,
              },
              {
                label: "Flashcards",
                description: "Create a 10-card study set from the source text.",
                action: "flashcards",
                buttonLabel: busyAction === "flashcards" ? "Generating…" : "Generate flashcards",
                handler: handleGenerateFlashcards,
              },
              {
                label: "Quiz",
                description: "Build a 5-question multiple-choice quiz.",
                action: "quiz",
                buttonLabel: busyAction === "quiz" ? "Generating…" : "Generate quiz",
                handler: handleGenerateQuiz,
              },
            ].map(({ label, description, action, buttonLabel, handler }) => (
              <div
                key={action}
                className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_18px_45px_-30px_rgba(15,23,42,0.28)]"
              >
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-500">AI generate</p>
                  <h3 className="mt-2 text-lg font-semibold tracking-tight text-slate-950">{label}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
                </div>
                <PrimaryButton
                  type="button"
                  onClick={handler}
                  disabled={!isReady || busyAction === action}
                  className="mt-auto"
                >
                  {buttonLabel}
                </PrimaryButton>
              </div>
            ))}
          </div>

          {/* Summary result */}
          {summary ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_18px_45px_-30px_rgba(15,23,42,0.28)]">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-500">Latest summary</p>
              <div className={`mt-4 ${md}`}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{summary}</ReactMarkdown>
              </div>
            </div>
          ) : null}

          {/* Explain concept */}
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_18px_45px_-30px_rgba(15,23,42,0.28)]">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-500">Explain a concept</p>
            <h3 className="mt-2 text-lg font-semibold tracking-tight text-slate-950">Concept explainer</h3>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              Type any term or idea from the document and get a grounded explanation.
            </p>
            <div className="mt-4 flex gap-3">
              <input
                value={concept}
                onChange={(e) => setConcept(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleExplainConcept()}
                placeholder="e.g. virtual memory, gradient descent…"
                disabled={!isReady || busyAction === "explain"}
                className="flex-1 rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100 disabled:opacity-60"
              />
              <PrimaryButton
                type="button"
                onClick={handleExplainConcept}
                disabled={!isReady || busyAction === "explain" || !concept.trim()}
              >
                {busyAction === "explain" ? "Explaining…" : "Explain"}
              </PrimaryButton>
            </div>
            {explanation ? (
              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="font-semibold text-slate-950">{explanation.concept}</p>
                <div className={`mt-3 ${md}`}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{explanation.explanation}</ReactMarkdown>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* ── Tab: Flashcards ── */}
      {activeTab === "flashcards" && (
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_18px_45px_-30px_rgba(15,23,42,0.35)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-slate-950">Flashcard sets</h2>
              <p className="mt-1 text-sm text-slate-500">{flashcardSets.length} sets · {totalCards} total cards</p>
            </div>
            <PrimaryButton
              type="button"
              onClick={handleGenerateFlashcards}
              disabled={!isReady || busyAction === "flashcards"}
            >
              {busyAction === "flashcards" ? "Generating…" : "New set"}
            </PrimaryButton>
          </div>

          {flashcardSets.length === 0 ? (
            <EmptyState
              compact
              title="No flashcard sets yet"
              description="Generate a set from this document to start studying."
            />
          ) : (
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {flashcardSets.map((set) => {
                const reviewed = set.cards.filter((c) => c.reviewCount > 0).length;
                const pct = set.cards.length > 0 ? Math.round((reviewed / set.cards.length) * 100) : 0;
                return (
                  <div key={set._id} className="flex flex-col gap-4 rounded-3xl border border-slate-200 p-4 transition hover:border-slate-300 hover:bg-slate-50">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-950">{set.cards.length} cards</p>
                        <p className="mt-1 text-sm text-slate-500">Created {formatDate(set.createdAt)}</p>
                      </div>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                        {pct}% reviewed
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 line-clamp-2">
                      {truncate(set.cards[0]?.question || "No cards available", 100)}
                    </p>
                    <div className="mt-auto">
                      <div className="mb-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                        <div className="h-full rounded-full bg-slate-950 transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <Link
                        to={`/documents/${id}/flashcards?set=${set._id}`}
                        className="mt-3 inline-flex items-center rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                      >
                        Study now
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Quizzes ── */}
      {activeTab === "quizzes" && (
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_18px_45px_-30px_rgba(15,23,42,0.35)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-slate-950">Quizzes</h2>
              <p className="mt-1 text-sm text-slate-500">{quizzes.length} generated from this document</p>
            </div>
            <PrimaryButton
              type="button"
              onClick={handleGenerateQuiz}
              disabled={!isReady || busyAction === "quiz"}
            >
              {busyAction === "quiz" ? "Generating…" : "New quiz"}
            </PrimaryButton>
          </div>

          {quizzes.length === 0 ? (
            <EmptyState
              compact
              title="No quizzes yet"
              description="Generate a quiz to test your understanding of the material."
            />
          ) : (
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {quizzes.map((quiz) => (
                <div key={quiz._id} className="flex flex-col gap-4 rounded-3xl border border-slate-200 p-4 transition hover:border-slate-300 hover:bg-slate-50">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-950">{quiz.title}</p>
                      <p className="mt-1 text-sm text-slate-500">{quiz.totalQuestions} questions</p>
                    </div>
                    {quiz.completedAt ? (
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                        {quiz.score}%
                      </span>
                    ) : (
                      <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
                        Pending
                      </span>
                    )}
                  </div>
                  {quiz.completedAt ? (
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                      <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${quiz.score}%` }} />
                    </div>
                  ) : null}
                  <div className="mt-auto flex gap-3">
                    <Link
                      to={quiz.completedAt ? `/quizzes/${quiz._id}/results` : `/quizzes/${quiz._id}`}
                      className="inline-flex items-center rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                    >
                      {quiz.completedAt ? "View results" : "Start quiz"}
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDeleteQuiz(quiz._id)}
                      className="inline-flex items-center rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-rose-300 hover:text-rose-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DocumentDetailPage;