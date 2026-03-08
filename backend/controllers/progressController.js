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

    // Aggregate flashcard statistics across all sets
    const flashcardSets = await Flashcard.find({ userId });
    let totalFlashcards = 0;
    let reviewedFlashcards = 0;
    let starredFlashcards = 0;
    flashcardSets.forEach((set) => {
      totalFlashcards += set.cards.length;
      reviewedFlashcards += set.cards.filter((c) => c.reviewCount > 0).length;
      starredFlashcards += set.cards.filter((c) => c.isStarred).length;
    });

    // Calculate average score across all completed quizzes
    const quizzes = await Quiz.find({ userId, completedAt: { $ne: null } });
    const averageScore =
      quizzes.length > 0
        ? Math.round(
            quizzes.reduce((sum, q) => sum + q.score, 0) / quizzes.length,
          )
        : 0;

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