import fs from "fs";
import { PDFParse } from "pdf-parse";

// Extract text from a pdf
export const extractTextFromPDF = async (filePath) => {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const parser = new PDFParse(new Uint8Array(dataBuffer));
    const data = await parser.getText();
    return {
      text: data.text,
      numPages: data.numpages,
      info: data.info,
    };
  } catch (error) {
    console.error("PDF Parsing Error", error);
    throw new Error("Failed to extract text from PDF");
  }
};