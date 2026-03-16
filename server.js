const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const app = express();
// Limit file uploads to 5MB
const upload = multer({ limits: { fileSize: 5 * 1024 * 1024 } });

app.use(cors());
app.use(express.json());
app.use(express.static('.'));

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// --- UPDATED MODEL & INSTRUCTIONS ---
// Now set to be a general assistant who only codes when requested.
const model = genAI.getGenerativeModel(
    { 
        model: "gemini-3-flash-preview",
        systemInstruction: "You are Gemini, a helpful and versatile AI assistant. You can converse naturally about any topic, including games, daily life, and general knowledge. However, you are also an expert programmer. When a user asks for code or help with a technical project (like Roblox Luau or Minecraft Skript), provide high-quality code using triple backticks. Do not force coding topics into general conversation."
    }, 
    { apiVersion: 'v1beta' }
);

app.post('/chat', upload.single('file'), async (req, res) => {
    try {
        let message = req.body.message || "";
        let history = [];
        
        // Safely parse chat history
        if (req.body.history) {
            try {
                const parsedHistory = JSON.parse(req.body.history);
                history = parsedHistory.map(item => ({
                    role: item.role,
                    parts: [{ text: item.parts[0].text }]
                }));
            } catch (e) {
                console.error("History Parse Error:", e);
            }
        }

        // File Handling: AI reads the content and sees it as part of the message
        if (req.file) {
            const fileContent = req.file.buffer.toString('utf8');
            message = `[CONTEXT: THE USER ATTACHED A FILE NAMED "${req.file.originalname}"]\n\nFILE CONTENT:\n${fileContent}\n\nUSER'S ACTUAL MESSAGE: ${message || "Please look at this file."}`;
        }

        const chat = model.startChat({ history });
        const result = await chat.sendMessage(message);
        const response = await result.response;
        
        res.json({ reply: response.text() });
    } catch (error) {
        console.error("Detailed Error:", error);
        
        // Handle common errors like rate limits or server wake-up delays
        if (error.message.includes("429")) {
            res.status(500).json({ reply: "System Error: Too many requests. Please wait a moment." });
        } else {
            res.status(500).json({ reply: "Server Error: I couldn't process that request right now." });
        }
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`-----------------------------------`);
    console.log(`AiEdits Server running on Port ${PORT}`);
    console.log(`Model: Gemini 3 Flash`);
    console.log(`-----------------------------------`);
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => console.log(`Neon Server running on ${PORT}`));
