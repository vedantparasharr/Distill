import { useEffect, useMemo, useState } from "react";
import moment from "moment";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import documentService from "../../services/documentService";
import { formatDate } from "../../utils/formatters";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PageShell,
  PrimaryButton,
  SecondaryButton,
  SectionCard,
  StatusBadge,
} from "../../components/common/ui";

const initialFormState = {
  title: "",
  url: "",
};

const YouTubeListPage = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState(initialFormState);

  const loadVideos = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await documentService.getYouTubeVideos();
      setVideos(response || []);
    } catch (requestError) {
      setError(requestError.error || requestError.message || "Unable to load videos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVideos();
  }, []);

  const videosSorted = useMemo(
    () => [...videos].sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate)),
    [videos],
  );

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.url.trim()) {
      toast.error("Paste a YouTube URL");
      return;
    }

    try {
      setSubmitting(true);
      await documentService.addYouTubeVideo({ title: form.title, url: form.url });
      toast.success("Video added. Processing transcript...");
      setForm(initialFormState);
      await loadVideos();
    } catch (requestError) {
      toast.error(requestError.error || requestError.message || "Failed to add video");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm("Delete this video and its data?");
    if (!confirmed) {
      return;
    }

    try {
      await documentService.deleteDocument(id);
      setVideos((current) => current.filter((video) => video._id !== id));
      toast.success("Video deleted");
    } catch (requestError) {
      toast.error(requestError.error || requestError.message || "Delete failed");
    }
  };

  return (
    <PageShell
      title="YouTube Videos"
      description="Add YouTube video links to extract transcripts and generate summaries, flashcards, quizzes, and chat responses."
      actions={<SecondaryButton onClick={loadVideos}>Refresh list</SecondaryButton>}
    >
      <SectionCard
        title="Add a Video"
        description="Paste a YouTube URL and we'll extract the transcript automatically."
      >
        <form onSubmit={handleSubmit} className="grid gap-3 lg:grid-cols-[1fr_1fr_auto]">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Title
            </span>
            <input
              value={form.title}
              onChange={(event) =>
                setForm((current) => ({ ...current, title: event.target.value }))
              }
              className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
              placeholder="Example: CS50 Lecture 1"
              required
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              YouTube URL
            </span>
            <input
              type="url"
              value={form.url}
              onChange={(event) =>
                setForm((current) => ({ ...current, url: event.target.value }))
              }
              className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
              placeholder="https://www.youtube.com/watch?v=..."
              required
            />
          </label>

          <div className="flex items-end">
            <PrimaryButton type="submit" disabled={submitting} className="w-full lg:w-auto">
              {submitting ? "Adding..." : "Add video"}
            </PrimaryButton>
          </div>
        </form>
      </SectionCard>

      {loading ? (
        <LoadingState label="Loading videos" />
      ) : error ? (
        <ErrorState description={error} />
      ) : videos.length === 0 ? (
        <EmptyState
          title="No YouTube videos added yet"
          description="Paste a YouTube link above to create your first video workspace."
        />
      ) : (
        <SectionCard title="Your videos" description="Transcript-based workspaces from YouTube.">
          <div className="grid gap-3 md:grid-cols-2">
            {videosSorted.map((video) => (
              <article
                key={video._id}
                className="rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-base font-semibold text-slate-900">
                      {video.title}
                    </h2>
                    <p className="mt-0.5 truncate text-sm text-slate-500" title={video.sourceUrl}>
                      {video.sourceUrl}
                    </p>
                  </div>
                  <StatusBadge status={video.status} />
                </div>

                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                  <span title={formatDate(video.uploadDate, { withTime: true })}>{moment(video.uploadDate).fromNow()}</span>
                  <span>{video.flashcardCount || 0} flashcards</span>
                  <span>{video.quizCount || 0} quizzes</span>
                </div>

                <div className="mt-4 flex gap-2">
                  <Link
                    to={`/youtube/${video._id}`}
                    className="inline-flex flex-1 items-center justify-center rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    Open
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleDelete(video._id)}
                    className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-rose-300 hover:text-rose-600"
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        </SectionCard>
      )}
    </PageShell>
  );
};

export default YouTubeListPage;
