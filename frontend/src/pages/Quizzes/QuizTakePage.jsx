import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import quizService from "../../services/quizService";
import {
  ErrorState,
  LoadingState,
  PageShell,
  PrimaryButton,
  SecondaryButton,
  SectionCard,
} from "../../components/common/ui";

const QuizTakePage = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadQuiz = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await quizService.getQuizById(quizId);
        setQuiz(response.data);

        if (response.data.completedAt) {
          navigate(`/quizzes/${quizId}/results`, { replace: true });
        }
      } catch (requestError) {
        setError(requestError.error || requestError.message || "Unable to load quiz");
      } finally {
        setLoading(false);
      }
    };

    loadQuiz();
  }, [navigate, quizId]);

  const currentQuestion = quiz?.questions?.[currentIndex];
  const answeredCount = useMemo(
    () => Object.values(answers).filter(Boolean).length,
    [answers],
  );

  const handleSubmit = async () => {
    if (!quiz) {
      return;
    }

    if (answeredCount !== quiz.questions.length) {
      toast.error("Answer every question before submitting");
      return;
    }

    try {
      setSubmitting(true);
      const payload = quiz.questions.map((_, index) => ({
        questionIndex: index,
        selectedAnswer: answers[index],
      }));
      await quizService.submitQuiz(quizId, payload);
      toast.success("Quiz submitted");
      navigate(`/quizzes/${quizId}/results`, { replace: true });
    } catch (requestError) {
      toast.error(requestError.error || requestError.message || "Could not submit quiz");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingState label="Loading quiz" />;
  }

  if (error) {
    return <ErrorState description={error} />;
  }

  return (
    <PageShell
      title={quiz?.title || "Quiz"}
      description="Choose one answer per question, then submit to calculate your score."
      actions={
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700">
          {answeredCount}/{quiz.questions.length} answered
        </div>
      }
    >
      <div className="mx-auto grid w-full max-w-4xl gap-4 sm:gap-5">
        <SectionCard title={`Question ${currentIndex + 1}`} description={currentQuestion?.difficulty ? `Difficulty: ${currentQuestion.difficulty}` : undefined}>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
            {currentQuestion?.question}
          </h2>

          <div className="mt-6 space-y-3">
            {currentQuestion?.options.map((option) => {
              const isSelected = answers[currentIndex] === option;

              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => setAnswers((current) => ({ ...current, [currentIndex]: option }))}
                  className={`block w-full rounded-3xl border p-4 text-left text-sm leading-7 transition ${isSelected ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 bg-white text-slate-800 hover:border-slate-300 hover:bg-slate-50"}`}
                >
                  {option}
                </button>
              );
            })}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <SecondaryButton
              onClick={() => setCurrentIndex((current) => Math.max(current - 1, 0))}
              disabled={currentIndex === 0}
            >
              Previous
            </SecondaryButton>
            <SecondaryButton
              onClick={() =>
                setCurrentIndex((current) => Math.min(current + 1, quiz.questions.length - 1))
              }
              disabled={currentIndex === quiz.questions.length - 1}
            >
              Next
            </SecondaryButton>
            <PrimaryButton type="button" onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Submitting..." : "Submit quiz"}
            </PrimaryButton>
          </div>
        </SectionCard>

        <SectionCard title="Question map" description="Jump quickly.">
          <div className="flex flex-wrap gap-2">
            {quiz.questions.map((_, index) => {
              const isAnswered = Boolean(answers[index]);
              const isCurrent = currentIndex === index;

              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => setCurrentIndex(index)}
                  className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border text-xs font-semibold transition ${isCurrent ? "border-slate-950 bg-slate-950 text-white" : isAnswered ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:text-slate-950"}`}
                  aria-label={`Go to question ${index + 1}`}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>
        </SectionCard>
      </div>
    </PageShell>
  );
};

export default QuizTakePage;