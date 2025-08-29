Real-Time Chat Application - Codtech Task 2
This is a real-time chat application built with Node.js, Express, and Socket.IO. It allows multiple users to join a chat room, send messages, and see who is online.

Features
Real-Time Messaging: Instant message delivery using WebSockets (Socket.IO).

User Authentication: Simple login with a username and avatar selection.

Online User List: View a list of all users currently in the chat room.

Typing Indicators: See when another user is typing a message.

Join/Leave Notifications: Get notified when users join or leave the chat.

Responsive Design: The chat interface is designed to work on both desktop and mobile devices.

System Messages: Welcome messages and other system-level notifications.

Connection Status: Visual indicators for connection to the server.

Project Structure
.
├── server.js               → The main Node.js server file
├── package.json            → Project metadata and dependencies
├── package-lock.json       → Exact dependency versions
├── public/
│   ├── index.html          → The main HTML file for the chat client
│   ├── script.js           → Client-side JavaScript for chat functionality
│   └── style.css           → CSS for styling the application
└── README.md               → Project documentation (this file)
Tech Stack Used
Backend: Node.js, Express.js

Real-time Communication: Socket.IO

Frontend: HTML5, CSS3, JavaScript (Vanilla)

Development Tool: nodemon for automatic server restarts

How to Run
Clone the repository:

git clone <repository-url>
Navigate to the project directory:


cd <project-directory>
Install dependencies:


npm install
Run the application:

For production:


npm start
For development (with auto-restart):


npm run dev
Open your browser and navigate to http://localhost:3000.

Author
Anjan Ghosh

License
This project is licensed under the MIT License.