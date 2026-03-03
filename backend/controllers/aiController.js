import Document from "../models/Document.js";
import Flashcard from "../models/Flashcard.js";
import Quiz from "../models/Quiz.js";
import ChatHistory from "../models/ChatHistory.js";
import * as geminiService from "../utils/geminiService.js";
import { findRelevantChunks } from "../utils/textChunker.js";

// @desc
// @route
// @access
export const generateFlashcards = async (req, res, next) => {
  try {
    const { documentId, count = 10 } = req.body;
    if (!documentId) {
      return res.status(404).json({
        success: false,
        error: "Please provide document Id",
        statusCode: 404,
      });
    }

    const document = await Document.findOne({
      _id: documentId,
      userId: req.user._id,
      status: "ready",
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        error: "Ducument does not exist or not ready",
        statusCode: 404,
      });
    }

    const cards = await geminiService.generateFlashcards(
      document.extractedText,
      parseInt(count),
    );

    // Save to databse
    const flashcardSet = await Flashcard.create({
      userId: req.user._id,
      documentId: document._id,
      cards: cards.map((card) => ({
        question: card.question,
        answer: card.answer,
        difficulty: card.difficulty,
        isStarred: false,
        reviewCount: 0,
      })),
    });

    res.status(200).json({
      success: true,
      data: flashcardSet,
      message: "Flashcards generated succesffully",
    });
  } catch (error) {
    next(error);
  }
};

// @desc
// @route
// @access
export const generateQuiz = async (req, res, next) => {
  try {
    const { documentId, numQuestions = 5, title } = req.body;

    if (!documentId) {
      return res.status(404).json({
        success: false,
        error: "Please provide document Id",
        statusCode: 404,
      });
    }

    const document = await Document.findOne({
      _id: documentId,
      userId: req.user._id,
      status: "ready",
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        error: "Ducument does not exist or not ready",
        statusCode: 404,
      });
    }

    const questions = await geminiService.generateQuiz(
      document.extractedText,
      parseInt(numQuestions),
    );

    // Save to database
    const quiz = await Quiz.create({
      userId: req.user._id,
      documentId: document._id,
      title: title || `${document.title} - Quiz`,
      questions: questions,
      totalQuestions: questions.length,
      userAnswers: [],
      score: 0,
    });

    res.status(201).json({
      success: true,
      data: quiz,
      message: "Quiz gene succ",
    });
  } catch (error) {
    next(error);
  }
};

// @desc
// @route
// @access
export const generateSummary = async (req, res, next) => {
  try {
  } catch (error) {
    next(error);
  }
};

// @desc
// @route
// @access
export const chat = async (req, res, next) => {
  try {
  } catch (error) {
    next(error);
  }
};

// @desc
// @route
// @access
export const explainConcept = async (req, res, next) => {
  try {
  } catch (error) {
    next(error);
  }
};

// @desc
// @route
// @access
export const getChathistory = async (req, res, next) => {
  try {
  } catch (error) {
    next(error);
  }
};
