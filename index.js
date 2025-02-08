import express from "express";
import multer from "multer";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
import ApiError from "./ApiError.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT;

// ✅ Set up Multer for file uploads
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (_, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

// ✅ Initialize Google Generative AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

async function analyzeVideo(videoPath, userQuery) {
  try {
    console.log("Processing video:", videoPath);

    // Ensure correct model initialization
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `
      Extract detailed insights from the uploaded video, structuring the summary for student notes.
      The summary should include:

      1. **Key Topics Covered**
      2. **Important Definitions & Terminologies**
      3. **Step-by-Step Explanation of Concepts**
      4. **Real-World Applications & Examples**
      5. **Critical Insights & Takeaways**

      **User Query:** ${userQuery}
    `;

    const result = await model.generateContent(prompt);
    const summary = result.response.text();
    return summary;
  } catch (error) {
    console.error("Error processing video:", error);
    return null;
  }
}

app.post("/summarize", upload.single("video"), async (req, res) => {
  try {
    if (!req.file) {
      throw new ApiError(500, "A video file is required.");
    }

    const userQuery =
      req.body.query || "Summarize the key points in this video.";
    const summary = await analyzeVideo(req.file.path, userQuery);

    if (summary) {
      return res.json({
        message: "Video processed successfully.",
        summary: summary,
      });
    } else {
      throw new ApiError(500, "Failed to generate summary.");
    }
  } catch (error) {
    throw new ApiError(
      500,
      `Failed to generate summary. ${error.message}`,
      error
    );
  }
});

// ✅ Start the Express Server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
