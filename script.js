let chats = JSON.parse(localStorage.getItem('ai_chats')) || [];
let currentChatId = null;

const chatList = document.getElementById('chatList');
const chatLog = document.getElementById('chatLog');
const input = document.getElementById("messageInput");

// STARTUP
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
        item.className = "chat-item";
        item.style = `padding: 12px; background: ${isActive ? 'rgba(0,0,0,0.2)' : 'transparent'}; color: ${isActive ? '#000' : '#222'}; border-radius: 8px; cursor: pointer; display: flex; justify-content: space-between; position: relative; margin-bottom: 5px; font-weight: bold;`;
        
        item.innerHTML = `
            <span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap; flex:1;">${chat.name}</span>
            <button onclick="toggleMenu(event, ${chat.id})" style="background:none; border:none; color:inherit; cursor:pointer; font-size:18px;">⋮</button>
            <div id="menu-${chat.id}" class="chat-options-menu">
                <div onclick="renameChat(${chat.id})">Rename</div>
                <div onclick="deleteChat(${chat.id})" style="color:#ff4444;">Delete</div>
            </div>
        `;
        item.onclick = (e) => { if (e.target.tagName !== 'BUTTON') loadChat(chat.id); };
        chatList.appendChild(item);
    });
}

function toggleMenu(event, id) {
    event.stopPropagation();
    const menu = document.getElementById(`menu-${id}`);
    document.querySelectorAll('.chat-options-menu').forEach(m => { if (m !== menu) m.style.display = 'none'; });
    menu.style.display = (menu.style.display === 'block') ? 'none' : 'block';
}

// Close menus on click
window.onclick = () => document.querySelectorAll('.chat-options-menu').forEach(m => m.style.display = 'none');

function loadChat(id) {
    currentChatId = id;
    const chat = chats.find(c => c.id === id);
    document.getElementById('activeChatTitle').innerText = chat.name;
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

function copyToClipboard(btn) {
    const code = btn.nextElementSibling.innerText;
    navigator.clipboard.writeText(code).then(() => {
        btn.innerText = "DONE!";
        setTimeout(() => btn.innerText = "Copy", 2000);
    });
}

document.getElementById("sendBtn").onclick = async () => {
    const msg = input.value.trim();
    const fileInput = document.getElementById("fileInput");
    const file = fileInput.files[0];
    
    if (!msg && !file) return;

    appendMessage("You", msg || `Sent file: ${file.name}`);
    input.value = "";
    
    const chat = chats.find(c => c.id === currentChatId);
    const formData = new FormData();
    formData.append('message', msg);
    formData.append('history', JSON.stringify(chat.history));
    if (file) formData.append('file', file);
    
    fileInput.value = "";
    document.getElementById('fileStatus').innerText = "";

    try {
        const res = await fetch("/chat", { method: "POST", body: formData });
        const data = await res.json();
        appendMessage("AI", data.reply);
        chat.history.push({ role: "user", parts: [{ text: msg || `[File: ${file.name}]` }] });
        chat.history.push({ role: "model", parts: [{ text: data.reply }] });
        saveChats();
    } catch (e) { appendMessage("AI", "Server Error."); }
};

function renameChat(id) {
    const n = prompt("Rename to:");
    if (n) { chats.find(c => c.id === id).name = n; saveChats(); }
}

function deleteChat(id) {
    if (confirm("Delete Chat?")) {
        chats = chats.filter(c => c.id !== id);
        if (chats.length === 0) createNewChat(); else loadChat(chats[0].id);
        saveChats();
    }
}
