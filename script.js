let chats = JSON.parse(localStorage.getItem('ai_chats')) || [];
let currentChatId = null;

const chatList = document.getElementById('chatList');
const chatLog = document.getElementById('chatLog');
const activeChatTitle = document.getElementById('activeChatTitle');
const input = document.getElementById("messageInput");

if (chats.length > 0) { loadChat(chats[0].id); } else { createNewChat(); }

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
        item.style = `padding: 10px; background: ${isActive ? '#111' : 'transparent'}; color: ${isActive ? '#00d4ff' : '#000'}; border-radius: 5px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; position: relative; margin-bottom: 5px; border: 1px solid ${isActive ? '#00d4ff' : 'transparent'};`;
        item.innerHTML = `
            <span style="flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${chat.name}</span>
            <button onclick="toggleMenu(event, ${chat.id})" style="background:none; border:none; color:inherit; cursor:pointer;">⋮</button>
            <div id="menu-${chat.id}" class="chat-options-menu">
                <div onclick="showRenameModal(${chat.id})" style="padding: 10px; color: #fff; cursor: pointer;">Rename</div>
                <div onclick="deleteChat(${chat.id})" style="padding: 10px; color: #ff4444; cursor: pointer;">Delete</div>
            </div>
        `;
        item.onclick = (e) => { if (e.target.tagName !== 'BUTTON') loadChat(chat.id); };
        chatList.appendChild(item);
    });
}

function appendMessage(sender, message) {
    const msgDiv = document.createElement("div");
    msgDiv.style = `padding: 12px; margin: 10px 0; border-radius: 8px; color: #fff; background: ${sender === "You" ? "#004a57" : "#21262d"}; border: 1px solid ${sender === "You" ? "#00d4ff" : "#30363d"};`;

    if (sender === "AI") {
        const formatted = message.replace(/```([\s\S]*?)```/g, (match, code) => {
            return `<div style="position: relative;"><button class="copy-btn" onclick="copyToClipboard(this)">Copy</button><pre><code>${code.trim()}</code></pre></div>`;
        });
        msgDiv.innerHTML = `<strong>${sender}:</strong> <div style="margin-top:5px;">${formatted}</div>`;
    } else {
        msgDiv.innerHTML = `<strong>${sender}:</strong> ${message}`;
    }
    chatLog.appendChild(msgDiv);
    chatLog.scrollTop = chatLog.scrollHeight;
}

function copyToClipboard(button) {
    const code = button.nextElementSibling.innerText;
    navigator.clipboard.writeText(code).then(() => {
        const old = button.innerText;
        button.innerText = "Copied!";
        setTimeout(() => button.innerText = old, 2000);
    });
}

document.getElementById("sendBtn").onclick = async () => {
    const userMessage = input.value.trim();
    if (!userMessage) return;
    appendMessage("You", userMessage);
    input.value = "";
    const chat = chats.find(c => c.id === currentChatId);
    const formData = new FormData();
    formData.append('message', userMessage);
    formData.append('history', JSON.stringify(chat.history));

    try {
        const response = await fetch("/chat", { method: "POST", body: formData });
        const data = await response.json();
        appendMessage("AI", data.reply);
        chat.history.push({ role: "user", parts: [{ text: userMessage }] });
        chat.history.push({ role: "model", parts: [{ text: data.reply }] });
        saveChats();
    } catch (e) { appendMessage("AI", "Error: Offline"); }
};
