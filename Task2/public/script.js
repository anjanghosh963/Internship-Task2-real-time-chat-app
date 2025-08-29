/**
 * Real-Time Chat Application - Frontend JavaScript
 * Codtech IT Solutions - Task 2
 * Developer: Anjan Ghosh
 * Description: Frontend Socket.IO client for real-time messaging
 */

// =================
// GLOBAL VARIABLES
// =================
let socket;
let currentUser = {
    username: '',
    avatar: '👤'
};
let typingTimer;
let isTyping = false;
let messageHistory = [];

// =================
// DOM ELEMENTS
// =================
const loginScreen = document.getElementById('loginScreen');
const chatScreen = document.getElementById('chatScreen');
const loginForm = document.getElementById('loginForm');
const usernameInput = document.getElementById('usernameInput');
const avatarOptions = document.querySelectorAll('.avatar-option');
const connectionStatus = document.getElementById('connectionStatus');
const statusDot = connectionStatus.querySelector('.status-dot');

const messagesArea = document.getElementById('messagesArea');
const messageForm = document.getElementById('messageForm');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const charCount = document.querySelector('.char-count');
const connectionIndicator = document.getElementById('connectionIndicator');
const userCount = document.getElementById('userCount');
const usersList = document.getElementById('usersList');
const usersSidebar = document.getElementById('usersSidebar');
const toggleUserListBtn = document.getElementById('toggleUserList');
const closeSidebarBtn = document.getElementById('closeSidebar');
const leaveChatBtn = document.getElementById('leaveChat');
const typingIndicator = document.getElementById('typingIndicator');
const typingText = document.getElementById('typingText');
const notificationsContainer = document.getElementById('notifications');
const loadingOverlay = document.getElementById('loadingOverlay');

// =================
// INITIALIZATION
// =================
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Initialize Socket.IO connection
    socket = io();
    
    // Set up event listeners
    setupEventListeners();
    
    // Handle socket events
    setupSocketEvents();
    
    // Focus on username input
    usernameInput.focus();
    
    console.log('Chat application initialized');
}

// =================
// EVENT LISTENERS
// =================
function setupEventListeners() {
    // Login form
    loginForm.addEventListener('submit', handleLogin);
    
    // Avatar selection
    avatarOptions.forEach(option => {
        option.addEventListener('click', handleAvatarSelection);
    });
    
    // Message form
    messageForm.addEventListener('submit', handleSendMessage);
    messageInput.addEventListener('input', handleMessageInput);
    messageInput.addEventListener('keypress', handleTyping);
    messageInput.addEventListener('keyup', handleStopTyping);
    
    // UI controls
    toggleUserListBtn.addEventListener('click', toggleUserSidebar);
    closeSidebarBtn.addEventListener('click', closeUserSidebar);
    leaveChatBtn.addEventListener('click', handleLeaveChat);
    
    // Username input validation
    usernameInput.addEventListener('input', validateUsername);
    
    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);
    
    // Window events
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
}

// =================
// SOCKET EVENTS
// =================
function setupSocketEvents() {
    // Connection events
    socket.on('connect', handleSocketConnect);
    socket.on('disconnect', handleSocketDisconnect);
    socket.on('connect_error', handleSocketError);
    
    // Chat events
    socket.on('receive-message', handleReceiveMessage);
    socket.on('user-joined-notification', handleUserJoined);
    socket.on('user-left-notification', handleUserLeft);
    socket.on('system-message', handleSystemMessage);
    socket.on('user-count-update', handleUserCountUpdate);
    socket.on('user-list-update', handleUserListUpdate);
    socket.on('user-typing', handleUserTyping);
}

// =================
// LOGIN HANDLING
// =================
function handleLogin(e) {
    e.preventDefault();
    
    const username = usernameInput.value.trim();
    if (!username) {
        showNotification('Please enter a username', 'error');
        return;
    }
    
    if (username.length > 20) {
        showNotification('Username must be 20 characters or less', 'error');
        return;
    }
    
    // Get selected avatar
    const selectedAvatar = document.querySelector('.avatar-option.selected');
    currentUser.username = username;
    currentUser.avatar = selectedAvatar.dataset.avatar;
    
    // Show loading
    showLoading('Joining chat...');
    
    // Emit user joined event
    socket.emit('user-joined', {
        username: currentUser.username,
        avatar: currentUser.avatar
    });
    
    // Switch to chat screen
    setTimeout(() => {
        loginScreen.classList.add('hidden');
        chatScreen.classList.remove('hidden');
        messageInput.removeAttribute('disabled');
        sendBtn.removeAttribute('disabled');
        messageInput.focus();
        hideLoading();
        
        showNotification(`Welcome to the chat, ${username}! 🎉`, 'success');
    }, 1000);
}

function handleAvatarSelection(e) {
    // Remove selected class from all options
    avatarOptions.forEach(option => option.classList.remove('selected'));
    
    // Add selected class to clicked option
    e.target.classList.add('selected');
}

function validateUsername() {
    const username = usernameInput.value.trim();
    const submitBtn = loginForm.querySelector('.join-btn');
    
    if (username.length === 0) {
        submitBtn.disabled = true;
    } else if (username.length > 20) {
        submitBtn.disabled = true;
        usernameInput.style.borderColor = '#ff4757';
    } else {
        submitBtn.disabled = false;
        usernameInput.style.borderColor = '#667eea';
    }
}

// =================
// MESSAGE HANDLING
// =================
function handleSendMessage(e) {
    e.preventDefault();
    
    const message = messageInput.value.trim();
    if (!message) return;
    
    if (message.length > 500) {
        showNotification('Message is too long (max 500 characters)', 'error');
        return;
    }
    
    // Emit message to server
    socket.emit('send-message', {
        message: message
    });
    
    // Clear input
    messageInput.value = '';
    updateCharCount();
    
    // Stop typing indicator
    if (isTyping) {
        socket.emit('typing-stop');
        isTyping = false;
    }
    
    // Focus back on input
    messageInput.focus();
}

function handleMessageInput() {
    updateCharCount();
}

function handleTyping() {
    if (!isTyping) {
        socket.emit('typing-start');
        isTyping = true;
    }
    
    // Clear existing timer
    clearTimeout(typingTimer);
    
    // Set new timer to stop typing after 3 seconds
    typingTimer = setTimeout(() => {
        if (isTyping) {
            socket.emit('typing-stop');
            isTyping = false;
        }
    }, 3000);
}

function handleStopTyping() {
    // Clear timer when user stops typing
    clearTimeout(typingTimer);
    
    // Set new timer to stop typing after 1 second of inactivity
    typingTimer = setTimeout(() => {
        if (isTyping) {
            socket.emit('typing-stop');
            isTyping = false;
        }
    }, 1000);
}

function updateCharCount() {
    const length = messageInput.value.length;
    charCount.textContent = `${length}/500`;
    
    // Update color based on length
    if (length > 450) {
        charCount.className = 'char-count danger';
    } else if (length > 400) {
        charCount.className = 'char-count warning';
    } else {
        charCount.className = 'char-count';
    }
}

// =================
// SOCKET EVENT HANDLERS
// =================
function handleSocketConnect() {
    console.log('Connected to server');
    updateConnectionStatus(true);
    showNotification('Connected to chat server', 'success');
}

function handleSocketDisconnect(reason) {
    console.log('Disconnected from server:', reason);
    updateConnectionStatus(false);
    showNotification('Disconnected from server', 'error');
    
    // Try to reconnect
    setTimeout(() => {
        if (!socket.connected) {
            socket.connect();
        }
    }, 3000);
}

function handleSocketError(error) {
    console.error('Socket connection error:', error);
    updateConnectionStatus(false);
    showNotification('Connection error. Please refresh the page.', 'error');
}

function handleReceiveMessage(data) {
    displayMessage(data);
    scrollToBottom();
    
    // Play notification sound (if permission granted)
    if (data.username !== currentUser.username) {
        playNotificationSound();
    }
    
    // Store in message history
    messageHistory.push(data);
    
    // Limit history to last 100 messages
    if (messageHistory.length > 100) {
        messageHistory.shift();
    }
}

function handleUserJoined(data) {
    displayNotification(data.message, 'user-joined');
    updateUserCount(data.userCount);
    scrollToBottom();
}

function handleUserLeft(data) {
    displayNotification(data.message, 'user-left');
    updateUserCount(data.userCount);
    scrollToBottom();
}

function handleSystemMessage(data) {
    displaySystemMessage(data.message);
    scrollToBottom();
}

function handleUserCountUpdate(count) {
    updateUserCount(count);
}

function handleUserListUpdate(users) {
    updateUsersList(users);
}

function handleUserTyping(data) {
    if (data.username === currentUser.username) return;
    
    if (data.isTyping) {
        showTypingIndicator(data.username);
    } else {
        hideTypingIndicator();
    }
}

// =================
// DISPLAY FUNCTIONS
// =================
function displayMessage(data) {
    const messageElement = document.createElement('div');
    messageElement.className = 'message';
    messageElement.innerHTML = `
        <div class="message-header">
            <span class="message-avatar">${data.avatar}</span>
            <span class="message-username">${escapeHtml(data.username)}</span>
            <span class="message-time">${formatTime(data.timestamp)}</span>
        </div>
        <div class="message-content">${escapeHtml(data.message)}</div>
    `;
    messagesArea.appendChild(messageElement);
}

function displaySystemMessage(message) {
    const systemElement = document.createElement('div');
    systemElement.className = 'system-message';
    systemElement.textContent = message;
    messagesArea.appendChild(systemElement);
}

function displayNotification(message, type) {
    const notificationElement = document.createElement('div');
    notificationElement.className = `notification-message ${type}`;
    notificationElement.innerHTML = `
        <span>${escapeHtml(message)}</span>
        <small>${formatTime(new Date())}</small>
    `;
    messagesArea.appendChild(notificationElement);
}

function updateUserCount(count) {
    const text = count === 1 ? '1 user online' : `${count} users online`;
    userCount.textContent = text;
}

function updateUsersList(users) {
    usersList.innerHTML = '';
    
    users.forEach(user => {
        const userElement = document.createElement('div');
        userElement.className = 'user-item';
        userElement.innerHTML = `
            <span class="user-avatar">${user.avatar}</span>
            <span class="user-name">${escapeHtml(user.username)}</span>
        `;
        usersList.appendChild(userElement);
    });
}

function showTypingIndicator(username) {
    typingText.textContent = `${username} is typing...`;
    typingIndicator.classList.remove('hidden');
    scrollToBottom();
}

function hideTypingIndicator() {
    typingIndicator.classList.add('hidden');
}

// =================
// UI FUNCTIONS
// =================
function toggleUserSidebar() {
    usersSidebar.classList.toggle('active');
}

function closeUserSidebar() {
    usersSidebar.classList.remove('active');
}

function handleLeaveChat() {
    if (confirm('Are you sure you want to leave the chat?')) {
        socket.disconnect();
        location.reload();
    }
}

function showLoading(message = 'Loading...') {
    const loadingText = loadingOverlay.querySelector('p');
    loadingText.textContent = message;
    loadingOverlay.classList.remove('hidden');
}

function hideLoading() {
    loadingOverlay.classList.add('hidden');
}

function scrollToBottom() {
    setTimeout(() => {
        messagesArea.scrollTop = messagesArea.scrollHeight;
    }, 100);
}

function updateConnectionStatus(connected) {
    const indicator = connectionIndicator.querySelector('.status-dot');
    const text = connectionIndicator.querySelector('span:last-child');
    
    if (connected) {
        indicator.classList.add('connected');
        indicator.classList.remove('disconnected');
        text.textContent = 'Connected';
        statusDot.classList.add('connected');
    } else {
        indicator.classList.remove('connected');
        indicator.classList.add('disconnected');
        text.textContent = 'Disconnected';
        statusDot.classList.remove('connected');
    }
}

// =================
// NOTIFICATION SYSTEM
// =================
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    notificationsContainer.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

// =================
// UTILITY FUNCTIONS
// =================
function formatTime(timestamp) {
    return new Date(timestamp).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function playNotificationSound() {
    // Create a simple notification sound
    if ('AudioContext' in window || 'webkitAudioContext' in window) {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.3);
            
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.3);
        } catch (error) {
            console.log('Could not play notification sound:', error);
        }
    }
}

// =================
// KEYBOARD SHORTCUTS
// =================
function handleKeyboardShortcuts(e) {
    // Escape to close sidebar
    if (e.key === 'Escape') {
        closeUserSidebar();
    }
    
    // Ctrl+U to toggle user list
    if (e.ctrlKey && e.key === 'u') {
        e.preventDefault();
        toggleUserSidebar();
    }
    
    // Ctrl+L to leave chat
    if (e.ctrlKey && e.key === 'l') {
        e.preventDefault();
        handleLeaveChat();
    }
}

// =================
// WINDOW EVENTS
// =================
function handleBeforeUnload(e) {
    if (socket && socket.connected) {
        socket.disconnect();
    }
}

function handleOnline() {
    showNotification('Connection restored', 'success');
    if (!socket.connected) {
        socket.connect();
    }
}

function handleOffline() {
    showNotification('Connection lost. Check your internet.', 'error');
}

// =================
// ERROR HANDLING
// =================
window.addEventListener('error', function(e) {
    console.error('JavaScript error:', e.error);
    showNotification('An error occurred. Please refresh the page.', 'error');
});

window.addEventListener('unhandledrejection', function(e) {
    console.error('Unhandled promise rejection:', e.reason);
    showNotification('Connection issue. Please try again.', 'error');
});

// =================
// DEVELOPMENT HELPERS
// =================
if (window.location.hostname === 'localhost') {
    // Development mode - add helpful console logs
    console.log('🚀 Chat application running in development mode');
    console.log('💡 Available keyboard shortcuts:');
    console.log('   - Escape: Close sidebar');
    console.log('   - Ctrl+U: Toggle user list');
    console.log('   - Ctrl+L: Leave chat');
    
    // Make socket available globally for debugging
    window.chatSocket = socket;
    window.currentUser = currentUser;
}