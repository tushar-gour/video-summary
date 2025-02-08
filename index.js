import express from "express";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
import ApiError from "./ApiError.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT;

// ✅ Middleware to parse JSON request bodies
app.use(express.json());

// ✅ Initialize Google Generative AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

async function analyzeVideo(videoUrl, userQuery) {
  try {
    console.log("Processing video:", videoUrl);

    // Ensure correct model initialization
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `
      Extract detailed insights from the YouTube video at the following URL: ${videoUrl}.
      Structure the summary for student notes with these key points:

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

app.post("/summarize", async (req, res) => {
  try {
    const {
      videoUrl,
      userQuery = "Summarize the key points of the topic explained in this video.",
    } = req.body;

    if (!videoUrl || !videoUrl.includes("youtube.com")) {
      throw new ApiError(400, "A valid YouTube video URL is required.");
    }

    const summary = await analyzeVideo(videoUrl, userQuery);

    if (summary) {
      return res.json({
        message: "Video processed successfully.",
        summary: summary,
      });
    } else {
      throw new ApiError(500, "Failed to generate summary.");
    }
  } catch (error) {
    throw new ApiError(500, `Internal server error. ${error.message}`, error);
  }
});

// ✅ Start the Express Server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
