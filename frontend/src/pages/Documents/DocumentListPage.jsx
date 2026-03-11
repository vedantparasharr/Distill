import { useEffect, useMemo, useState } from "react";
import moment from "moment";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import documentService from "../../services/documentService";
import { formatBytes, formatDate } from "../../utils/formatters";
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

const initialUploadState = {
  title: "",
  file: null,
};

const DocumentListPage = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [uploadForm, setUploadForm] = useState(initialUploadState);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await documentService.getDocuments();
      setDocuments(response || []);
    } catch (requestError) {
      setError(requestError.error || requestError.message || "Unable to load documents");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const documentsSorted = useMemo(
    () => [...documents].sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate)),
    [documents],
  );

  const handleUpload = async (event) => {
    event.preventDefault();

    if (!uploadForm.file) {
      toast.error("Select a PDF to upload");
      return;
    }

    const formData = new FormData();
    formData.append("title", uploadForm.title);
    formData.append("file", uploadForm.file);

    try {
      setUploading(true);
      await documentService.uploadDocument(formData);
      toast.success("Document uploaded. Processing started.");
      setUploadForm(initialUploadState);
      await loadDocuments();
    } catch (requestError) {
      toast.error(requestError.error || requestError.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm("Delete this document and its source file?");
    if (!confirmed) {
      return;
    }

    try {
      await documentService.deleteDocument(id);
      setDocuments((current) => current.filter((document) => document._id !== id));
      toast.success("Document deleted");
    } catch (requestError) {
      toast.error(requestError.error || requestError.message || "Delete failed");
    }
  };

  return (
    <PageShell
      title="Documents"
      description="Upload PDFs and open each workspace to generate summaries, flashcards, quizzes, and chat responses."
      actions={<SecondaryButton onClick={loadDocuments}>Refresh list</SecondaryButton>}
    >
      <SectionCard
        title="Quick Upload"
        description="Keep this compact. Add a title, pick a PDF, and continue."
      >
        <form onSubmit={handleUpload} className="grid gap-3 lg:grid-cols-[1fr_1fr_auto]">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Title
            </span>
            <input
              value={uploadForm.title}
              onChange={(event) =>
                setUploadForm((current) => ({ ...current, title: event.target.value }))
              }
              className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
              placeholder="Example: Operating Systems Notes"
              required
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              PDF
            </span>
            <input
              type="file"
              accept="application/pdf"
              onChange={(event) =>
                setUploadForm((current) => ({ ...current, file: event.target.files?.[0] || null }))
              }
              className="block w-full rounded-2xl border border-slate-300 bg-white px-3 py-2.5 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-slate-950 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white"
              required
            />
          </label>

          <div className="flex items-end">
            <PrimaryButton type="submit" disabled={uploading} className="w-full lg:w-auto">
              {uploading ? "Uploading..." : "Upload"}
            </PrimaryButton>
          </div>
        </form>
        {uploadForm.file ? (
          <p className="mt-3 text-xs text-slate-500">Selected: {uploadForm.file.name}</p>
        ) : null}
      </SectionCard>

      {loading ? (
        <LoadingState label="Loading documents" />
      ) : error ? (
        <ErrorState description={error} />
      ) : documents.length === 0 ? (
        <EmptyState
          title="No documents uploaded yet"
          description="Upload a PDF above to create your first study workspace."
        />
      ) : (
        <SectionCard title="Your library" description="Clean document cards with quick actions and progress context.">
          <div className="grid gap-3 md:grid-cols-2">
            {documentsSorted.map((document) => (
              <article
                key={document._id}
                className="rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-base font-semibold text-slate-900">
                      {document.title}
                    </h2>
                    <p className="mt-0.5 truncate text-sm text-slate-500" title={document.fileName}>
                      {document.fileName}
                    </p>
                  </div>
                  <StatusBadge status={document.status} />
                </div>

                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                  <span title={formatDate(document.uploadDate, { withTime: true })}>{moment(document.uploadDate).fromNow()}</span>
                  <span>{formatBytes(document.fileSize)}</span>
                  <span>{document.flashcardCount || 0} flashcards</span>
                  <span>{document.quizCount || 0} quizzes</span>
                </div>

                <div className="mt-4 flex gap-2">
                  <Link
                    to={`/documents/${document._id}`}
                    className="inline-flex flex-1 items-center justify-center rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    Open
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleDelete(document._id)}
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

export default DocumentListPage;