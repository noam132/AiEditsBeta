let chats = JSON.parse(localStorage.getItem('ai_chats')) || [];
let currentChatId = null;

const chatList = document.getElementById('chatList');
const chatLog = document.getElementById('chatLog');
const activeChatTitle = document.getElementById('activeChatTitle');
const input = document.getElementById("messageInput");

// Initialize
if (chats.length > 0) {
    loadChat(chats[0].id);
} else {
    createNewChat();
}

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
        
        item.style = `padding: 12px; background: ${isActive ? 'rgba(0,0,0,0.2)' : 'transparent'}; color: ${isActive ? '#000' : '#222'}; border-radius: 8px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; font-weight: bold; position: relative; margin-bottom: 5px;`;
        
        item.innerHTML = `
            <span style="flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${chat.name}</span>
            <button onclick="toggleMenu(event, ${chat.id})" style="background:none; border:none; color:inherit; cursor:pointer; font-size: 20px;">⋮</button>
            <div id="menu-${chat.id}" class="chat-options-menu">
                <div onclick="showRenameModal(${chat.id})">Rename</div>
                <div onclick="deleteChat(${chat.id})" style="color: #ff4444;">Delete</div>
            </div>
        `;

        item.onclick = (e) => {
            if (e.target.tagName !== 'BUTTON' && e.target.parentElement.className !== 'chat-options-menu') {
                loadChat(chat.id);
            }
        };
        chatList.appendChild(item);
    });
}

function toggleMenu(event, id) {
    event.stopPropagation();
    const menu = document.getElementById(`menu-${id}`);
    const allMenus = document.querySelectorAll('.chat-options-menu');
    allMenus.forEach(m => { if (m !== menu) m.style.display = 'none'; });
    menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
}

// Close menus when clicking elsewhere
window.onclick = () => {
    document.querySelectorAll('.chat-options-menu').forEach(m => m.style.display = 'none');
};

function loadChat(id) {
    currentChatId = id;
    const chat = chats.find(c => c.id === id);
    activeChatTitle.innerText = chat.name;
    chatLog.innerHTML = '';
    chat.history.forEach(m => {
        appendMessage(m.role === 'user' ? 'You' : 'AI', m.parts[0].text);
    });
    renderSidebar();
}

function appendMessage(sender, message) {
    const msgDiv = document.createElement("div");
    msgDiv.style = `padding: 12px; margin: 10px 0; border-radius: 8px; color: #fff; background: ${sender === "You" ? "#002222" : "#111"}; border: 1px solid ${sender === "You" ? "#00ffff" : "#333"};`;

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
        const old = button.innerText;
        button.innerText = "COPIED!";
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
    } catch (e) {
        appendMessage("AI", "Error: Server Offline");
    }
};

// Rename/Delete Functions
function showRenameModal(id) {
    const newName = prompt("Enter new chat name:");
    if (newName) {
        const chat = chats.find(c => c.id === id);
        chat.name = newName;
        saveChats();
        if (currentChatId === id) activeChatTitle.innerText = newName;
    }
}

function deleteChat(id) {
    if (confirm("Delete this chat?")) {
        chats = chats.filter(c => c.id !== id);
        if (chats.length === 0) createNewChat();
        else if (currentChatId === id) loadChat(chats[0].id);
        saveChats();
    }
}
