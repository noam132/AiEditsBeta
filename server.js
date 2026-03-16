const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const app = express();

// --- 1. FILE SIZE CHECK ---
// Limits uploads to 5MB. Change '5' to '10' if you need bigger files.
const upload = multer({ limits: { fileSize: 5 * 1024 * 1024 } });

app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// --- 2. DUMMY KEY SAFETY ---
// Prevents crash if the API key isn't found in Render Environment Variables.
const apiKey = process.env.GEMINI_API_KEY || "DUMMY_KEY";
const genAI = new GoogleGenerativeAI(apiKey);

// --- 3. MODEL & PERSONALITY ---
// Gemini 3 Flash configured to be a general helper, but a pro at code.
const model = genAI.getGenerativeModel(
    { 
        model: "gemini-3-flash-preview",
        systemInstruction: "You are Gemini, a helpful AI assistant. You can talk about anything from games to daily life. You are also an expert in Roblox Luau, Minecraft Skript, and Web Dev. Only provide code when asked. Always use triple backticks for code blocks."
    }, 
    { apiVersion: 'v1beta' }
);

// Health Check (For Render to stay awake)
app.get('/status', (req, res) => res.send('AI Server is Running!'));

app.post('/chat', upload.single('file'), async (req, res) => {
    try {
        let message = req.body.message || "";
        let history = [];
        
        // Handle history safely to prevent JSON errors
        if (req.body.history) {
            try {
                const parsedHistory = JSON.parse(req.body.history);
                history = parsedHistory.map(item => ({
                    role: item.role,
                    parts: [{ text: item.parts[0].text }]
                }));
            } catch (e) {
                console.error("History parse warning:", e);
            }
        }

        // --- 4. FILE CHECK ---
        // If a file is uploaded, convert it to text and add it to the message.
        if (req.file) {
            const fileContent = req.file.buffer.toString('utf8');
            message = `[ATTACHED FILE: ${req.file.originalname}]\n\nCONTENT:\n${fileContent}\n\nUSER MESSAGE: ${message || "Analyze this file."}`;
        }

        // Safety: Don't send empty requests to Google
        if (!message && !req.file) {
            return res.status(400).json({ reply: "Please type a message or select a file." });
        }

        const chat = model.startChat({ history });
        const result = await chat.sendMessage(message);
        const response = await result.response;
        
        res.json({ reply: response.text() });

    } catch (error) {
        console.error("Detailed Error:", error);
        
        // Friendly errors so the user knows what happened
        if (apiKey === "DUMMY_KEY") {
            res.status(500).json({ reply: "Error: API Key is missing. Set GEMINI_API_KEY in Render." });
        } else {
            res.status(500).json({ reply: "The AI is currently busy. Please try again in a moment." });
        }
    }
});

// Port configuration for Render
const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server Online - Port ${PORT}`);
});
