let chats = JSON.parse(localStorage.getItem('ai_chats')) || [];
let currentChatId = null;

const chatList = document.getElementById('chatList');
const chatLog = document.getElementById('chatLog');
const activeChatTitle = document.getElementById('activeChatTitle');
const input = document.getElementById("messageInput");

// Init
if (chats.length > 0) loadChat(chats[0].id); else createNewChat();

function createNewChat() {
    const newChat = { id: Date.now(), name: "New Chat", history: [] };
    chats.unshift(newChat);
    saveChats();
    loadChat(newChat.id);
}

function saveChats() {
    localStorage.setItem('ai_chats', JSON.stringify(chats));
    renderSidebar();
}

function renderSidebar() {
    chatList.innerHTML = '';
    chats.forEach(chat => {
        const item = document.createElement('div');
        const isActive = chat.id === currentChatId;
        item.style = `padding: 10px; margin-bottom: 5px; border-radius: 5px; cursor: pointer; color: ${isActive ? '#000' : '#222'}; background: ${isActive ? 'rgba(255,255,255,0.3)' : 'transparent'}; font-weight: bold;`;
        item.innerText = chat.name;
        item.onclick = () => loadChat(chat.id);
        chatList.appendChild(item);
    });
}

function loadChat(id) {
    currentChatId = id;
    const chat = chats.find(c => c.id === id);
    activeChatTitle.innerText = chat.name;
    chatLog.innerHTML = '';
    chat.history.forEach(m => appendMessage(m.role === 'user' ? 'You' : 'AI', m.parts[0].text));
    renderSidebar();
}

function appendMessage(sender, message) {
    const msgDiv = document.createElement("div");
    msgDiv.style = `padding: 12px; margin: 10px 0; border-radius: 8px; border: 1px solid ${sender === 'You' ? '#00ffff' : '#333'}; background: ${sender === 'You' ? '#002222' : '#111'}`;

    if (sender === "AI") {
        const formatted = message.replace(/```([\s\S]*?)```/g, (match, code) => {
            return `<div style="position: relative;"><button class="copy-btn" onclick="copyToClipboard(this)">Copy</button><pre><code>${code.trim()}</code></pre></div>`;
        });
        msgDiv.innerHTML = `<strong style="color:#00ffff">${sender}:</strong> <div style="margin-top:5px;">${formatted}</div>`;
    } else {
        msgDiv.innerHTML = `<strong>${sender}:</strong> ${message}`;
    }
    chatLog.appendChild(msgDiv);
    chatLog.scrollTop = chatLog.scrollHeight;
}

function copyToClipboard(button) {
    const code = button.nextElementSibling.innerText;
    navigator.clipboard.writeText(code).then(() => {
        button.innerText = "COPIED!";
        setTimeout(() => button.innerText = "COPY", 2000);
    });
}

document.getElementById("sendBtn").onclick = async () => {
    const msg = input.value.trim();
    if (!msg) return;
    appendMessage("You", msg);
    input.value = "";
    
    const chat = chats.find(c => c.id === currentChatId);
    try {
        const response = await fetch("/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: msg, history: JSON.stringify(chat.history) })
        });
        const data = await response.json();
        appendMessage("AI", data.reply);
        chat.history.push({ role: "user", parts: [{ text: msg }] });
        chat.history.push({ role: "model", parts: [{ text: data.reply }] });
        saveChats();
    } catch (e) { appendMessage("AI", "Error connecting to server."); }
};
