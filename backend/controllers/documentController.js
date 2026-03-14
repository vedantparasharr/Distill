import Flashcard from "../models/Flashcard.js";
import Quiz from "../models/Quiz.js";
import Document from "../models/Document.js";
import { extractTextFromPDF } from "../utils/pdfParser.js";
import { chunkText } from "../utils/textChunker.js";
import fs from "fs/promises";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import { extractTranscriptFromYT } from "../utils/ytParser.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// @desc  Upload PDF Document
// @route POST /api/documents/upload
// @access Private
export const uploadDocument = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No file uploaded",
        statusCode: 400,
      });
    }

    const { title } = req.body;
    if (!title) {
      await fs.unlink(req.file.path);
      return res.status(400).json({
        success: false,
        error: "Title is required",
        statusCode: 400,
      });
    }

    const baseUrl = `http://localhost:${process.env.PORT || 8000}`;
    const fileUrl = `${baseUrl}/uploads/documents/${req.file.filename}`;

    const document = await Document.create({
      userId: req.user.id,
      title,
      sourceType: "pdf",
      fileName: req.file.originalname,
      filePath: fileUrl,
      fileSize: req.file.size,
      status: "processing",
    });

    processPDF(document._id, req.file.path).catch((err) => {
      console.error("PDF processing error", err);
    });

    res.status(201).json({
      success: true,
      data: document,
      message: "Document uploaded. Processing in background...",
      statusCode: 201,
    });
  } catch (error) {
    if (req.file) {
      await fs.unlink(req.file.path).catch(() => {});
    }
    next(error);
  }
};

// Helper function to process PDF
const processPDF = async (documentId, filePath) => {
  try {
    const { text } = await extractTextFromPDF(filePath);
    const chunks = await chunkText(text, 500, 50);

    await Document.findByIdAndUpdate(documentId, {
      extractedText: text,
      chunks: chunks,
      status: "ready",
    });
    console.log(`Document ${documentId} processed successfully`);
  } catch (error) {
    console.error(`Error processing document ${documentId}`, error);
    await Document.findByIdAndUpdate(documentId, {
      status: "failed",
    });
  }
};

// @desc  Upload YT Video
// @route POST /api/documents/youtube
// @access Private
export const createYouTubeDocument = async (req, res, next) => {
  try {
    const { title, url } = req.body;
    if (!url) {
      return res.status(400).json({
        success: false,
        error: "URL is required",
        statusCode: 400,
      });
    }

    if (!title) {
      return res.status(400).json({
        success: false,
        error: "Title is required",
        statusCode: 400,
      });
    }

    const document = await Document.create({
      userId: req.user.id,
      title,
      sourceType: "youtube",
      sourceUrl: url,
      status: "processing",
    });

    processYT(document._id, url).catch((err) => {
      console.error("YouTube processing error", err);
    });

    res.status(201).json({
      success: true,
      data: document,
      message: "Document uploaded. Processing in background...",
      statusCode: 201,
    });
  } catch (error) {
    next(error);
  }
};

// helper function for youtube videos
const processYT = async (documentId, url) => {
  try {
    const { text } = await extractTranscriptFromYT(url);
    const chunks = await chunkText(text, 500, 50);

    await Document.findByIdAndUpdate(documentId, {
      extractedText: text,
      chunks: chunks,
      status: "ready",
    });
    console.log(`Document ${documentId} processed successfully`);
  } catch (error) {
    console.error(`Error processing document ${documentId}`, error);
    await Document.findByIdAndUpdate(documentId, {
      status: "failed",
    });
  }
};

// @desc  Get all user documents
// @route GET /api/documents/
// @access Private
export const getDocuments = async (req, res, next) => {
  try {
    const { sourceType } = req.query;
    if (!sourceType || !["pdf", "youtube"].includes(sourceType)) {
      return res.status(400).json({
        success: false,
        error: "sourceType query is required and must be 'pdf' or 'youtube'",
        statusCode: 400,
      });
    }

    const documents = await Document.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(req.user._id),
          sourceType,
        },
      },
      {
        $lookup: {
          from: "flashcards",
          localField: "_id",
          foreignField: "documentId",
          as: "flashcardSets",
        },
      },
      {
        $lookup: {
          from: "quizzes",
          localField: "_id",
          foreignField: "documentId",
          as: "quizzes",
        },
      },
      {
        $addFields: {
          flashcardCount: { $size: "$flashcardSets" },
          quizCount: { $size: "$quizzes" },
        },
      },
      {
        $project: {
          extractedText: 0,
          chunks: 0,
          flashcardSets: 0,
          quizzes: 0,
        },
      },
      {
        $sort: {
          uploadDate: -1,
        },
      },
    ]);

    res.status(200).json({
      success: true,
      count: documents.length,
      data: documents,
      message: "Documents retrieved successfully",
      statusCode: 200,
    });
  } catch (error) {
    next(error);
  }
};

// @desc  Get a single document
// @route GET /api/documents/:id
// @access Private
export const getDocument = async (req, res, next) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        error: "Document not found",
        statusCode: 404,
      });
    }

    const flashcardCount = await Flashcard.countDocuments({
      documentId: document._id,
      userId: req.user._id,
    });
    const quizCount = await Quiz.countDocuments({
      documentId: document._id,
      userId: req.user._id,
    });

    document.lastAccessed = Date.now();
    await document.save();

    const documentData = document.toObject();
    delete documentData.extractedText;
    delete documentData.chunks;
    documentData.flashcardCount = flashcardCount;
    documentData.quizCount = quizCount;

    res.status(200).json({
      success: true,
      data: documentData,
      message: "Document retrieved successfully",
      statusCode: 200,
    });
  } catch (error) {
    next(error);
  }
};

// @desc  Delete a document
// @route DELETE /api/documents/:id
// @access Private
export const deleteDocument = async (req, res, next) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        error: "Document not found",
        statusCode: 404,
      });
    }

    if (document.sourceType === "pdf" && document.filePath) {
      const relativePath = document.filePath.replace(
        `http://localhost:${process.env.PORT || 8000}`,
        "",
      );
      const absolutePath = path.join(__dirname, "..", relativePath);
      await fs.unlink(absolutePath).catch(() => {});
    }

    await document.deleteOne();

    res.status(200).json({
      success: true,
      message: "Document deleted successfully",
      statusCode: 200,
    });
  } catch (error) {
    next(error);
  }
};
