let chats = JSON.parse(localStorage.getItem('ai_chats')) || [];
let currentChatId = null;

const chatList = document.getElementById('chatList');
const chatLog = document.getElementById('chatLog');
const input = document.getElementById("messageInput");

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
        item.style = `padding: 12px; background: ${isActive ? 'rgba(0,0,0,0.2)' : 'transparent'}; color: ${isActive ? '#000' : '#222'}; border-radius: 8px; cursor: pointer; display: flex; justify-content: space-between; position: relative; margin-bottom: 5px;`;
        item.innerHTML = `
            <span>${chat.name}</span>
            <button onclick="toggleMenu(event, ${chat.id})" style="background:none; border:none; cursor:pointer;">⋮</button>
            <div id="menu-${chat.id}" class="chat-options-menu">
                <div onclick="renameChat(${chat.id})">Rename</div>
                <div onclick="deleteChat(${chat.id})" style="color:red;">Delete</div>
            </div>
        `;
        item.onclick = (e) => { if (e.target.tagName !== 'BUTTON') loadChat(chat.id); };
        chatList.appendChild(item);
    });
}

function toggleMenu(event, id) {
    event.stopPropagation();
    const menu = document.getElementById(`menu-${id}`);
    document.querySelectorAll('.chat-options-menu').forEach(m => m.style.display = 'none');
    menu.style.display = 'block';
}

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
    msgDiv.className = "message";
    msgDiv.style = `padding: 12px; margin: 10px 0; border-radius: 8px; border: 1px solid ${sender === 'You' ? '#00ffff' : '#333'}; background: ${sender === 'You' ? '#002222' : '#111'}`;
    msgDiv.innerHTML = `<strong>${sender}:</strong> <div>${message}</div>`;
    chatLog.appendChild(msgDiv);
    chatLog.scrollTop = chatLog.scrollHeight;
}

document.getElementById("sendBtn").onclick = async () => {
    const msg = input.value.trim();
    if (!msg) return;
    appendMessage("You", msg);
    input.value = "";
    
    const chat = chats.find(c => c.id === currentChatId);
    const response = await fetch("/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, history: JSON.stringify(chat.history) })
    });
    const data = await response.json();
    appendMessage("AI", data.reply);
    chat.history.push({ role: "user", parts: [{ text: msg }] }, { role: "model", parts: [{ text: data.reply }] });
    saveChats();
};

function renameChat(id) {
    const n = prompt("New name?");
    if (n) { chats.find(c => c.id === id).name = n; saveChats(); }
}

function deleteChat(id) {
    if (confirm("Delete?")) {
        chats = chats.filter(c => c.id !== id);
        if (chats.length === 0) createNewChat(); else loadChat(chats[0].id);
        saveChats();
    }
}
