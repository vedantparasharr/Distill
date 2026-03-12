import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

if (!process.env.GEMINI_API_KEY) {
  console.error("FATAL ERROR: GEMINI_API_KEY is not set in the environment variables.");
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const MODEL = "gemini-2.5-flash-lite";

const jsonConfig = (schema) => ({
  responseMimeType: "application/json",
  responseSchema: schema,
});

// ── Schemas ──────────────────────────────────────────────────────────

const flashcardSchema = {
  type: "array",
  items: {
    type: "object",
    properties: {
      question: { type: "string" },
      answer: { type: "string" },
      difficulty: { type: "string", enum: ["easy", "medium", "hard"] },
    },
    required: ["question", "answer", "difficulty"],
  },
};

const quizSchema = {
  type: "array",
  items: {
    type: "object",
    properties: {
      question: { type: "string" },
      options: { type: "array", items: { type: "string" }, minItems: 4, maxItems: 4 },
      correctAnswer: { type: "string" },
      explanation: { type: "string" },
      difficulty: { type: "string", enum: ["easy", "medium", "hard"] },
    },
    required: ["question", "options", "correctAnswer", "explanation", "difficulty"],
  },
};

const summarySchema = {
  type: "object",
  properties: {
    summary: { type: "string" },
  },
  required: ["summary"],
};

const chatSchema = {
  type: "object",
  properties: {
    answer: { type: "string" },
  },
  required: ["answer"],
};

const explainSchema = {
  type: "object",
  properties: {
    explanation: { type: "string" },
  },
  required: ["explanation"],
};

// ── Generators ───────────────────────────────────────────────────────

// Generate flashcards from document text
export const generateFlashcards = async (text, count = 10) => {
  const prompt = `Generate exactly ${count} educational flashcards from the following text. Each flashcard must have a clear question, a concise answer, and a difficulty level (easy, medium, or hard).\n\nText:\n${text.substring(0, 15000)}`;

  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: jsonConfig(flashcardSchema),
    });

    const cards = JSON.parse(response.text);
    return cards.slice(0, count);
  } catch (error) {
    console.error("Gemini API error:", error);
    throw new Error("Failed to generate flashcards");
  }
};

// Generate multiple choice quiz questions from document text
export const generateQuiz = async (text, numQuestions = 5) => {
  const prompt = `Generate exactly ${numQuestions} multiple choice questions from the following text. Each question must have exactly 4 options, a correctAnswer that matches one of the options exactly, a brief explanation, and a difficulty level (easy, medium, or hard).\n\nText:\n${text.substring(0, 15000)}`;

  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: jsonConfig(quizSchema),
    });

    const questions = JSON.parse(response.text);
    return questions.slice(0, numQuestions);
  } catch (error) {
    console.error("Gemini API error:", error);
    throw new Error("Failed to generate quiz");
  }
};

// Generate a concise summary of document text
export const generateSummary = async (text) => {
  const prompt = `Provide a concise summary of the following text, highlighting the key concepts, main ideas, and important points. Keep the summary clear and structured. Use markdown formatting.\n\nText:\n${text.substring(0, 20000)}`;

  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: jsonConfig(summarySchema),
    });

    const result = JSON.parse(response.text);
    return result.summary;
  } catch (error) {
    console.error("Gemini API error:", error);
    throw new Error("Failed to generate summary");
  }
};

// Answer a user question based on relevant document chunks
export const chatWithContext = async (question, chunks) => {
  const context = chunks.map((c, i) => `[Chunk ${i + 1}]\n${c.content}`).join("\n\n");

  const prompt = `Based on the following context from a document, answer the user's question accurately. If the answer is not in the context, say so. Use markdown formatting for the answer.\n\nContext:\n${context}\n\nQuestion: ${question}`;

  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: jsonConfig(chatSchema),
    });

    const result = JSON.parse(response.text);
    return result.answer;
  } catch (error) {
    console.error("Gemini API error:", error);
    throw new Error("Failed to process chat request");
  }
};

// Explain a specific concept using relevant document context
export const explainConcept = async (concept, context) => {
  const prompt = `Explain the concept of "${concept}" based on the following context. Provide a clear, educational explanation that's easy to understand. Include examples if relevant. Use markdown formatting.\n\nContext:\n${context.substring(0, 10000)}`;

  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: jsonConfig(explainSchema),
    });

    const result = JSON.parse(response.text);
    return result.explanation;
  } catch (error) {
    console.error("Gemini API error:", error);
    throw new Error("Failed to explain concept");
  }
};