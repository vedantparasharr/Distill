import { useEffect, useState } from "react";
import moment from "moment";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import flashcardService from "../../services/flashcardService";
import { formatDate } from "../../utils/formatters";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PageShell,
  SecondaryButton,
  SectionCard,
} from "../../components/common/ui";

const FlashcardListPage = () => {
  const [flashcardSets, setFlashcardSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadSets = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await flashcardService.getAllFlashcardSets();
      setFlashcardSets(response.data || []);
    } catch (requestError) {
      setError(requestError.error || requestError.message || "Unable to load flashcard sets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSets();
  }, []);

  const handleDeleteSet = async (setId) => {
    const confirmed = window.confirm("Delete this flashcard set?");
    if (!confirmed) {
      return;
    }

    try {
      await flashcardService.deleteFlashcardSet(setId);
      setFlashcardSets((current) => current.filter((set) => set._id !== setId));
      toast.success("Flashcard set deleted");
    } catch (requestError) {
      toast.error(requestError.error || requestError.message || "Could not delete set");
    }
  };

  return (
    <PageShell
      title="Flashcards"
      description="Review all generated flashcard sets across your document library."
      actions={<SecondaryButton onClick={loadSets}>Refresh sets</SecondaryButton>}
    >
      {loading ? (
        <LoadingState label="Loading flashcards" />
      ) : error ? (
        <ErrorState description={error} />
      ) : flashcardSets.length === 0 ? (
        <EmptyState
          title="No flashcards available"
          description="Generate flashcards from a ready document to populate this view."
          action={
            <Link
              to="/documents"
              className="rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Go to documents
            </Link>
          }
        />
      ) : (
        <SectionCard title="All flashcard sets" description="Open a study view or remove outdated sets.">
          <div className="grid gap-3 md:grid-cols-2">
            {flashcardSets.map((set) => {
              const reviewedCards = set.cards.filter((card) => card.reviewCount > 0).length;
              const starredCards = set.cards.filter((card) => card.isStarred).length;
              const documentId = set.documentId?._id || set.documentId;

              return (
                <article
                  key={set._id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h2 className="truncate text-base font-semibold text-slate-900">
                        {set.documentId?.title || "Untitled document"}
                      </h2>
                      <p className="mt-0.5 truncate text-sm text-slate-500" title={set.documentId?.fileName || "Unknown source file"}>
                        {set.documentId?.fileName || "Unknown source file"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                    <span title={formatDate(set.createdAt, { withTime: true })}>Created {moment(set.createdAt).fromNow()}</span>
                    <span>{set.cards.length} cards</span>
                    <span>{reviewedCards} reviewed</span>
                    <span>{starredCards} starred</span>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <Link
                      to={`/documents/${documentId}/flashcards?set=${set._id}`}
                      className="inline-flex flex-1 items-center justify-center rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                    >
                      Study set
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDeleteSet(set._id)}
                      className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-rose-300 hover:text-rose-600"
                    >
                      Delete
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </SectionCard>
      )}
    </PageShell>
  );
};

export default FlashcardListPage;