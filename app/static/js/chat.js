document.addEventListener('DOMContentLoaded', () => {
    loadUsers();
});

document.getElementById('messageInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

let selectedUser = null;
let socket = null;
let messagePollingInterval = null;


function subscribeToTelegram() {
    const userId = localStorage.getItem('user_id');
    const telegramUrl = `https://t.me/msg_notification_sender_bot?start=${userId}`;
    window.open(telegramUrl, '_blank');
}

async function handleLogout() {
    localStorage.removeItem('token');
    window.location.href = '/login';
}

function selectUser(userId, userName) {
    selectedUser = userId;
    document.querySelectorAll('.user-item').forEach(item =>
        item.classList.remove('active')
    );
    document.getElementById(`user-${userId}`).classList.add('active');

    const chatMessages = document.getElementById('chatMessages');
    chatMessages.innerHTML = '';

    const messageInput = document.getElementById('messageInput');
    const sendButton = document.querySelector('.send-btn');
    messageInput.disabled = false;
    sendButton.disabled = false;

    loadMessages(userId);
    connectWebSocket();
    startMessagePolling(userId);
}

async function loadUsers() {
    try {
        const response = await fetch('/users', {
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            }
        });
        const users = await response.json();

        const userList = document.getElementById('userList');
        userList.innerHTML = users.map(user => `
            <div class="user-item" id="user-${user.id}" onclick="selectUser(${user.id}, '${user.username}')">
                ${user.username}
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

function connectWebSocket() {
    if (socket) socket.close();

    socket = new WebSocket(`wss://${window.location.host}/chat/ws/${selectedUser}`);

    socket.onopen = () => console.log('WebSocket соединение установлено');

    socket.onmessage = (event) => {
        const incomeMessage = JSON.parse(event.data);
        if (incomeMessage.userId === selectedUser) {
            addMessage(incomeMessage.content, incomeMessage.userId);
        }
    };

    socket.onclose = () => console.log('WebSocket соединение закрыто');
}

async function loadMessages(userId) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/messages/${userId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                console.error("Unauthorized: Token might be invalid or expired");
                handleLogout();
            } else {
                console.error(`Error loading messages: ${response.statusText}`);
            }
            return;
        }

        const messages = await response.json();
        if (!Array.isArray(messages)) {
            console.error("Error: Expected an array but got:", messages);
            return;
        }

        const chatMessages = document.getElementById('chatMessages');
        const messagesContainer = document.createElement('div');
        messagesContainer.className = 'messages-container';

        messages.forEach(message => {
            const time = new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const messageGroup = document.createElement('div');
            const is_sent = message.sender_id !== userId
            messageGroup.className = `message-group ${is_sent ? 'sent' : ''}`;
            messageGroup.innerHTML = `
                <div class="message ${is_sent ? 'sent' : 'received'}">
                    ${message.content}
                    <div class="message-time">${time}</div>
                </div>
            `;
            messagesContainer.appendChild(messageGroup);
        });

        chatMessages.innerHTML = '';
        chatMessages.appendChild(messagesContainer);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    } catch (error) {
        console.error('Error loading messages:', error);
    }
}

async function sendMessage() {
    if (!selectedUser) return;

    const messageInput = document.getElementById('messageInput');
    const content = messageInput.value.trim();
    if (!content) return;

    try {
        const response = await fetch('/messages/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            },
            body: JSON.stringify({
                receiver_id: selectedUser,
                content: content
            })
        });

        if (!response.ok) {
            if (response.status === 401) {
                console.error("Unauthorized: Token might be invalid or expired");
                await handleLogout();
            } else {
                console.error('Error sending message:', response.statusText);
            }
            return;
        }

        messageInput.value = '';
        console.log("Message input cleared");

        socket.send(JSON.stringify( {
                receiver_id: selectedUser,
                content: content
        }));

        addMessage(content, selectedUser);

        await loadMessages(selectedUser);
    } catch (error) {
        console.error('Error sending message:', error);
    }
}


function addMessage(text, recipient_id) {
    const messagesContainer = document.getElementById('messages');
    messagesContainer.insertAdjacentHTML('beforeend', createMessageElement(text, recipient_id));
}

function createMessageElement(text, recipient_id) {
    const userID = parseInt(selectedUser, 10);
    const messageClass = userID === recipient_id ? 'my-message' : 'other-message';
    return `<div class="message ${messageClass}">${text}</div>`;
}

function startMessagePolling(userId) {
    clearInterval(messagePollingInterval);
    messagePollingInterval = setInterval(() => loadMessages(userId), 1000);
}