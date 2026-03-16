const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const app = express();
const upload = multer({ limits: { fileSize: 5 * 1024 * 1024 } });

app.use(cors());
app.use(express.json());
app.use(express.static('.'));

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// --- FIXED: USING GEMINI 3 FLASH + FULL PERSONALITY ---
const model = genAI.getGenerativeModel(
    { 
        model: "gemini-3-flash-preview",
        systemInstruction: "You are Gemini, a versatile AI assistant trained by Google. You are an expert in everything from general conversation to complex coding in Roblox, Minecraft, and Web Dev. Always use triple backticks for code."
    }, 
    { apiVersion: 'v1beta' }
);

app.post('/chat', upload.single('file'), async (req, res) => {
    try {
        let message = req.body.message || "";
        let history = JSON.parse(req.body.history || "[]").map(item => ({
            role: item.role,
            parts: [{ text: item.parts[0].text }]
        }));

        if (req.file) {
            const fileContent = req.file.buffer.toString('utf8');
            message = `[FILE: ${req.file.originalname}]\n${fileContent}\n\nUSER: ${message}`;
        }

        const chat = model.startChat({ history });
        const result = await chat.sendMessage(message);
        const response = await result.response;
        res.json({ reply: response.text() });
    } catch (error) {
        res.status(500).json({ reply: "Beta Error: " + error.message });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => console.log(`Neon Server running on ${PORT}`));
