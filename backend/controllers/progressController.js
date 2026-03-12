import Document from "../models/Document.js";
import Quiz from "../models/Quiz.js";
import Flashcard from "../models/Flashcard.js";

// @desc    Get dashboard overview including document, flashcard, and quiz statistics
// @route   GET /api/progress/dashboard
// @access  Private
export const getDashboard = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Run independent count queries in parallel for performance
    const [totalDocuments, totalFlashcardSets, totalQuizzes, completedQuizzes] =
      await Promise.all([
        Document.countDocuments({ userId }),
        Flashcard.countDocuments({ userId }),
        Quiz.countDocuments({ userId }),
        Quiz.countDocuments({ userId, completedAt: { $ne: null } }),
      ]);

    // Aggregate flashcard statistics in MongoDB instead of loading all docs
    const [flashcardStats] = await Flashcard.aggregate([
      { $match: { userId: req.user._id } },
      { $unwind: "$cards" },
      {
        $group: {
          _id: null,
          totalFlashcards: { $sum: 1 },
          reviewedFlashcards: {
            $sum: { $cond: [{ $gt: ["$cards.reviewCount", 0] }, 1, 0] },
          },
          starredFlashcards: {
            $sum: { $cond: ["$cards.isStarred", 1, 0] },
          },
        },
      },
    ]);
    const totalFlashcards = flashcardStats?.totalFlashcards || 0;
    const reviewedFlashcards = flashcardStats?.reviewedFlashcards || 0;
    const starredFlashcards = flashcardStats?.starredFlashcards || 0;

    // Aggregate average score in MongoDB
    const [quizStats] = await Quiz.aggregate([
      { $match: { userId: req.user._id, completedAt: { $ne: null } } },
      { $group: { _id: null, averageScore: { $avg: "$score" } } },
    ]);
    const averageScore = Math.round(quizStats?.averageScore || 0);

    // Fetch the 5 most recently accessed documents
    const recentDocuments = await Document.find({ userId })
      .sort({ lastAccessed: -1 })
      .limit(5)
      .select("title fileName lastAccessed status");

    // Fetch the 5 most recently created quizzes with their source document title
    const recentQuizzes = await Quiz.find({ userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("documentId", "title")
      .select("title score totalQuestions completedAt");

    const studyStreak = Math.floor(Math.random() * 7) + 1; // Mock

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalDocuments,
          totalFlashcardSets,
          totalFlashcards,
          reviewedFlashcards,
          starredFlashcards,
          totalQuizzes,
          completedQuizzes,
          averageScore,
          studyStreak,
        },
        recentActivity: {
          documents: recentDocuments,
          quizzes: recentQuizzes,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};