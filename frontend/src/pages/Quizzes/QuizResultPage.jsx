import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import quizService from "../../services/quizService";
import { formatDate } from "../../utils/formatters";
import {
  ErrorState,
  LoadingState,
  PageShell,
  SectionCard,
} from "../../components/common/ui";

const QuizResultPage = () => {
  const { quizId } = useParams();
  const [resultData, setResultData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadResults = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await quizService.getQuizResults(quizId);
        setResultData(response.data);
      } catch (requestError) {
        setError(requestError.error || requestError.message || "Unable to load quiz results");
      } finally {
        setLoading(false);
      }
    };

    loadResults();
  }, [quizId]);

  if (loading) {
    return <LoadingState label="Loading results" />;
  }

  if (error) {
    return <ErrorState description={error} />;
  }

  const quiz = resultData.quiz;

  return (
    <PageShell
      title={quiz.title}
      description="Review every answer, see the explanation, and identify weak areas quickly."
      actions={
        <Link
          to={`/documents/${quiz.document?._id || ""}`}
          className="rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-950"
        >
          Back to document
        </Link>
      }
    >
      <div className="grid gap-4 md:grid-cols-3">
        <SectionCard className="p-4" title="Score">
          <p className="text-4xl font-semibold tracking-tight text-slate-950">{quiz.score}%</p>
        </SectionCard>
        <SectionCard className="p-4" title="Questions">
          <p className="text-4xl font-semibold tracking-tight text-slate-950">{quiz.totalQuestions}</p>
        </SectionCard>
        <SectionCard className="p-4" title="Completed">
          <p className="text-sm leading-7 text-slate-600">{formatDate(quiz.completedAt, { withTime: true })}</p>
        </SectionCard>
      </div>

      <SectionCard title="Detailed review" description="Correct answers, your answer, and the explanation for each question.">
        <div className="space-y-4">
          {resultData.results.map((item) => (
            <article key={item.questionIndex} className="rounded-3xl border border-slate-200 p-5">
              <div className="flex items-start justify-between gap-4">
                <h2 className="text-lg font-semibold tracking-tight text-slate-950">
                  {item.questionIndex + 1}. {item.question}
                </h2>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${item.isCorrect ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                  {item.isCorrect ? "Correct" : "Incorrect"}
                </span>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="rounded-3xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Your answer</p>
                  <p className="mt-2 text-sm leading-7 text-slate-700">{item.selectedAnswer || "No answer submitted"}</p>
                </div>
                <div className="rounded-3xl bg-emerald-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">Correct answer</p>
                  <p className="mt-2 text-sm leading-7 text-emerald-900">{item.correctAnswer}</p>
                </div>
              </div>

              <div className="mt-4 rounded-3xl border border-slate-200 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Explanation</p>
                <p className="mt-2 text-sm leading-7 text-slate-700">{item.explanation || "No explanation provided."}</p>
              </div>
            </article>
          ))}
        </div>
      </SectionCard>
    </PageShell>
  );
};

export default QuizResultPage;