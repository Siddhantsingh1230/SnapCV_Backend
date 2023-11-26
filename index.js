import express from "express";
import { configDotenv } from "dotenv";
import multer from "multer";
import { PDFExtract } from "pdf.js-extract";
import { SummarizerManager } from "node-summarizer";
import path from "path";
import cors from "cors";

const app = express();
const pdfExtract = new PDFExtract();

//middlewares
app.use(express.json());
app.use(express.static(path.resolve("views")));
app.use(
  cors({
    origin: ["http://localhost:5000", "http://localhost:3000",process.env.FRONTEND_URI],
    method: ["GET", "POST", "DELETE", "PUT"],
    credentials: true,
  })
);

//environment variables
configDotenv({
  path: "./config/shell.env",
});

// Set up multer for handling file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Routes

app.get("/", (req, res) => {
  res.status(200).json({ success: true, message: "All Systems Normal" });
});

// Handle file upload
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    let resumeText = "";
    const buffer = req.file.buffer;
    const options = {
      disableCombineTextItems: true,
    }; /* pdf Options */
    pdfExtract.extractBuffer(buffer, options, async (err, data) => {
      if (err) return console.log(err);
      data.pages[0].content.map((elem) => {
        resumeText += elem.str;
      });
      let Summarizer = new SummarizerManager(resumeText, 25);
      let summary = Summarizer.getSummaryByFrequency().summary;
      let sentiment = Summarizer.getSentiment();
      res
        .status(200)
        .json({
          success: true,
          summary,
          sentiment,
          name: req.file.originalname,
          size: req.file.size,
        });
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err,
    });
  }
});

app.listen(process.env.PORT, (err) => {
  if (err) throw err;
  console.log(`SnapCV initialised -> ${process.env.PORT}`);
});
