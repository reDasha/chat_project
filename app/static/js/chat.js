document.addEventListener('DOMContentLoaded', () => {
    loadUsers();
    connectWebSocket();
});

document.getElementById('messageInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

let selectedUser = null;
let socket = null;


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
    document.querySelectorAll('.user-item').forEach(item => {
        item.classList.remove('active');
        item.classList.remove('new-message');
    });
    document.getElementById(`user-${userId}`).classList.add('active');

    const chatMessages = document.getElementById('chatMessages');
    chatMessages.innerHTML = '';

    const messageInput = document.getElementById('messageInput');
    const sendButton = document.querySelector('.send-btn');
    messageInput.disabled = false;
    sendButton.disabled = false;

    loadMessages(userId);
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
        console.error('Ошибка загрузки пользователей:', error);
    }
}

let sockets = {};

function connectWebSocket() {
    if (selectedUser === null) return;

    if (sockets[selectedUser]) {
        console.log("WebSocket уже подключен для этого пользователя.");
        return;
    }

    sockets[selectedUser] = new WebSocket(`ws://${window.location.host}/chat/ws/${selectedUser}`);

    sockets[selectedUser].onopen = () => console.log(`WebSocket соединение установлено для пользователя ${selectedUser}`);

    sockets[selectedUser].onmessage = (event) => {
        const incomingMessage = JSON.parse(event.data);
        const isForSelectedUser = incomingMessage.sender_id === selectedUser || incomingMessage.receiver_id === selectedUser;
        if (isForSelectedUser) {
            addMessage(incomingMessage.content, incomingMessage.sender_id);
        }

        if (!isForSelectedUser) {
            const userElement = document.getElementById(`user-${incomingMessage.sender_id}`);
            if (userElement) {
                userElement.classList.add('new-message');
            }
        }
    };

    sockets[selectedUser].onclose = () => {
        console.log(`WebSocket соединение закрыто для пользователя ${selectedUser}`);
        delete sockets[selectedUser];
    };
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
                console.error(`Ошибка загрузки сообщений: ${response.statusText}`);
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


function addMessage(text, senderId) {
    const chatMessages = document.getElementById('chatMessages');

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const isSent = senderId !== selectedUser;

    const messageGroup = document.createElement('div');
    messageGroup.className = `message-group ${isSent ? 'sent' : ''}`;
    messageGroup.innerHTML = `
        <div class="message ${isSent ? 'sent' : 'received'}">
            ${text}
            <div class="message-time">${time}</div>
        </div>
    `;
    chatMessages.appendChild(messageGroup);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function createMessageElement(text, recipient_id) {
    const userID = parseInt(selectedUser, 10);
    const messageClass = userID === recipient_id ? 'my-message' : 'other-message';
    return `<div class="message ${messageClass}">${text}</div>`;
}
