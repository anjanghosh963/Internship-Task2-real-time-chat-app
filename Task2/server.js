/**
 * Real-Time Chat Application - Server
 * Codtech IT Solutions - Task 2
 * Developer: Anjan Ghosh
 * Description: Node.js server with Socket.IO for real-time messaging
 */

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Store connected users
const connectedUsers = new Map();
let userCount = 0;

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log(`New connection: ${socket.id}`);

    // Handle user joining
    socket.on('user-joined', (userData) => {
        const { username, avatar } = userData;
        
        // Store user data
        connectedUsers.set(socket.id, {
            username: username,
            avatar: avatar,
            joinTime: new Date()
        });

        // Join the main chat room
        socket.join('main-room');
        
        userCount++;
        
        console.log(`${username} joined the chat (${userCount} users online)`);
        
        // Notify all users about new user
        socket.broadcast.to('main-room').emit('user-joined-notification', {
            username: username,
            avatar: avatar,
            message: `${username} joined the chat`,
            timestamp: new Date(),
            userCount: userCount
        });

        // Send current user count to the new user
        socket.emit('user-count-update', userCount);
        
        // Send user list to new user
        const userList = Array.from(connectedUsers.values()).map(user => ({
            username: user.username,
            avatar: user.avatar
        }));
        socket.emit('user-list-update', userList);
        
        // Send welcome message to the user
        socket.emit('system-message', {
            message: `Welcome to the chat, ${username}! 🎉`,
            timestamp: new Date()
        });
    });

    // Handle new messages
    socket.on('send-message', (messageData) => {
        const user = connectedUsers.get(socket.id);
        
        if (user) {
            const message = {
                id: generateMessageId(),
                username: user.username,
                avatar: user.avatar,
                message: messageData.message,
                timestamp: new Date(),
                type: 'user-message'
            };

            console.log(`Message from ${user.username}: ${messageData.message}`);
            
            // Broadcast message to all users in the room (including sender)
            io.to('main-room').emit('receive-message', message);
        }
    });

    // Handle typing indicators
    socket.on('typing-start', () => {
        const user = connectedUsers.get(socket.id);
        if (user) {
            socket.broadcast.to('main-room').emit('user-typing', {
                username: user.username,
                isTyping: true
            });
        }
    });

    socket.on('typing-stop', () => {
        const user = connectedUsers.get(socket.id);
        if (user) {
            socket.broadcast.to('main-room').emit('user-typing', {
                username: user.username,
                isTyping: false
            });
        }
    });

    // Handle user disconnect
    socket.on('disconnect', (reason) => {
        const user = connectedUsers.get(socket.id);
        
        if (user) {
            console.log(`${user.username} disconnected: ${reason}`);
            
            // Remove user from connected users
            connectedUsers.delete(socket.id);
            userCount--;
            
            // Notify all users about user leaving
            socket.broadcast.to('main-room').emit('user-left-notification', {
                username: user.username,
                avatar: user.avatar,
                message: `${user.username} left the chat`,
                timestamp: new Date(),
                userCount: userCount
            });

            // Update user count for all remaining users
            socket.broadcast.to('main-room').emit('user-count-update', userCount);
            
            // Update user list for all remaining users
            const userList = Array.from(connectedUsers.values()).map(u => ({
                username: u.username,
                avatar: u.avatar
            }));
            socket.broadcast.to('main-room').emit('user-list-update', userList);
        }
        
        console.log(`Connection closed: ${socket.id} (${userCount} users online)`);
    });

    // Handle connection errors
    socket.on('error', (error) => {
        console.error(`Socket error for ${socket.id}:`, error);
    });
});

// Utility function to generate unique message IDs
function generateMessageId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Error handling for server
server.on('error', (error) => {
    console.error('Server error:', error);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log('=================================');
    console.log('🚀 CODTECH CHAT SERVER STARTED');
    console.log('=================================');
    console.log(`📡 Server running on port ${PORT}`);
    console.log(`🌐 Open: http://localhost:${PORT}`);
    console.log(`👨‍💻 Developer: Anjan Ghosh`);
    console.log(`📝 Task: Real-time Chat Application`);
    console.log('=================================');
});

// Export for testing
module.exports = { app, server, io };