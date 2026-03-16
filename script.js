let chats = JSON.parse(localStorage.getItem('ai_chats')) || [];
let currentChatId = null;

const chatList = document.getElementById('chatList');
const chatLog = document.getElementById('chatLog');
const activeChatTitle = document.getElementById('activeChatTitle');
const input = document.getElementById("messageInput");

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
        
        item.style = `padding: 10px; background: ${isActive ? '#111' : 'transparent'}; color: ${isActive ? '#00d4ff' : '#000'}; border-radius: 5px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; font-weight: 500; transition: 0.2s; margin-bottom: 5px; border: 1px solid ${isActive ? '#00d4ff' : 'transparent'}; position: relative;`;
        
        // Removed Red X, added toggleMenu to