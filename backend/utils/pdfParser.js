import { PDFParse } from "pdf-parse";

// Extract text from PDF buffer
export const extractTextFromPDF = async (buffer) => {
  try {
    const parser = new PDFParse(new Uint8Array(buffer));

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
