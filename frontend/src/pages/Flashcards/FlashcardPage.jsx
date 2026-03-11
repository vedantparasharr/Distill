import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { Star } from "lucide-react";
import flashcardService from "../../services/flashcardService";
import { formatDate } from "../../utils/formatters";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PageShell,
  PrimaryButton,
  SecondaryButton,
  SectionCard,
} from "../../components/common/ui";

const FlashcardPage = () => {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [flashcardSets, setFlashcardSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cardIndex, setCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [busyAction, setBusyAction] = useState("");

  const activeSetId = searchParams.get("set");

  const loadSets = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await flashcardService.getFlashcardsForDocument(id);
      const sets = response.data || [];
      setFlashcardSets(sets);

      if (sets.length > 0 && !activeSetId) {
        setSearchParams({ set: sets[0]._id }, { replace: true });
      }
    } catch (requestError) {
      setError(requestError.error || requestError.message || "Unable to load flashcards");
    } finally {
      setLoading(false);
    }
  }, [activeSetId, id, setSearchParams]);

  useEffect(() => {
    loadSets();
  }, [loadSets]);

  const activeSet = useMemo(() => {
    return flashcardSets.find((set) => set._id === activeSetId) || flashcardSets[0] || null;
  }, [activeSetId, flashcardSets]);

  const currentCard = activeSet?.cards?.[cardIndex] || null;

  useEffect(() => {
    setCardIndex(0);
    setIsFlipped(false);
  }, [activeSetId]);

  const updateActiveSet = (updatedSet) => {
    setFlashcardSets((current) =>
      current.map((set) => (set._id === updatedSet._id ? updatedSet : set)),
    );
  };

  const handleReview = async () => {
    if (!currentCard) {
      return;
    }

    try {
      setBusyAction("review");
      const response = await flashcardService.reviewFlashcard(currentCard._id);
      updateActiveSet(response.data);
      toast.success("Flashcard review recorded");
    } catch (requestError) {
      toast.error(requestError.error || requestError.message || "Could not record review");
    } finally {
      setBusyAction("");
    }
  };

  const handleToggleStar = async () => {
    if (!currentCard) {
      return;
    }

    try {
      setBusyAction("star");
      const response = await flashcardService.toggleStar(currentCard._id);
      updateActiveSet(response.data);
    } catch (requestError) {
      toast.error(requestError.error || requestError.message || "Could not update star");
    } finally {
      setBusyAction("");
    }
  };

  if (loading) {
    return <LoadingState label="Loading flashcard study view" />;
  }

  if (error) {
    return <ErrorState description={error} action={<SecondaryButton onClick={loadSets}>Try again</SecondaryButton>} />;
  }

  if (!activeSet) {
    return (
      <PageShell title="Flashcards" description="No study set was found for this document.">
        <EmptyState
          title="No flashcards for this document"
          description="Generate a flashcard set from the document workspace first."
          action={
            <Link
              to={`/documents/${id}`}
              className="rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Back to document
            </Link>
          }
        />
      </PageShell>
    );
  }

  return (
    <PageShell
      title={activeSet.documentId?.title || "Flashcard study"}
      description="Flip through generated cards, star the important ones, and track review counts."
      actions={<SecondaryButton onClick={loadSets}>Refresh sets</SecondaryButton>}
    >
      <div className="grid gap-4 sm:gap-6 xl:grid-cols-[0.78fr_1.22fr]">
        <SectionCard title="Available sets" description="Switch between generated sets for this document.">
          <div className="space-y-3">
            {flashcardSets.map((set) => (
              <button
                key={set._id}
                type="button"
                onClick={() => setSearchParams({ set: set._id })}
                className={`block w-full rounded-3xl border p-4 text-left transition ${set._id === activeSet._id ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-semibold tracking-tight">{set.cards.length} cards</h2>
                    <p className={`mt-1 text-sm ${set._id === activeSet._id ? "text-slate-300" : "text-slate-600"}`}>
                      Created {formatDate(set.createdAt, { withTime: true })}
                    </p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${set._id === activeSet._id ? "bg-white/10 text-white" : "bg-slate-100 text-slate-700"}`}>
                    {set.cards.filter((card) => card.isStarred).length} starred
                  </span>
                </div>
              </button>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Study" description="Flip the card to reveal the answer, then record your review.">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-slate-600">
              Card {cardIndex + 1} of {activeSet.cards.length}
            </p>
            <button
              type="button"
              onClick={handleToggleStar}
              disabled={!currentCard || busyAction === "star"}
              className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-semibold transition ${currentCard?.isStarred ? "border-amber-300 bg-amber-50 text-amber-700" : "border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:text-slate-950"}`}
            >
              <Star className={`h-4 w-4 ${currentCard?.isStarred ? "fill-current" : ""}`} />
              {currentCard?.isStarred ? "Starred" : "Star card"}
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsFlipped((current) => !current)}
            className="mt-5 block min-h-[280px] w-full rounded-3xl border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-5 text-left shadow-[0_22px_60px_-38px_rgba(15,23,42,0.45)] transition hover:border-slate-300 sm:min-h-[360px] sm:rounded-[2rem] sm:p-8"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-orange-500">
              {isFlipped ? "Answer" : "Question"}
            </p>
            <div className="mt-6 text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl">
              {isFlipped ? currentCard?.answer : currentCard?.question}
            </div>
            <p className="mt-6 text-sm leading-7 text-slate-600">
              Difficulty: {currentCard?.difficulty} • Reviews: {currentCard?.reviewCount || 0}
            </p>
          </button>

          <div className="mt-5 flex flex-wrap gap-3">
            <SecondaryButton
              onClick={() => {
                setCardIndex((current) => Math.max(current - 1, 0));
                setIsFlipped(false);
              }}
              disabled={cardIndex === 0}
            >
              Previous
            </SecondaryButton>
            <SecondaryButton
              onClick={() => {
                setCardIndex((current) => Math.min(current + 1, activeSet.cards.length - 1));
                setIsFlipped(false);
              }}
              disabled={cardIndex === activeSet.cards.length - 1}
            >
              Next
            </SecondaryButton>
            <PrimaryButton type="button" onClick={handleReview} disabled={busyAction === "review"}>
              {busyAction === "review" ? "Saving..." : "Mark reviewed"}
            </PrimaryButton>
          </div>
        </SectionCard>
      </div>
    </PageShell>
  );
};

export default FlashcardPage;