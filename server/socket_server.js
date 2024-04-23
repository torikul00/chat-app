const express = require('express');
const http = require('http');
const app = express();
const { Server } = require("socket.io");
require('dotenv').config();
const server = http.createServer(app);
const jwt = require("jsonwebtoken");
const connectDatabase = require('./src/config/connectDatabase');
const { v4: uid } = require('uuid')

const io = new Server(server, {
    cors: {
        origin: [process.env.CLIENT_URL],
        methods: ["GET", "POST"],
    }
});

let onlineUsers = []

const authenticateUser = (socket, token, next) => {
    if (!token) return next(new Error("Authentication error"));
    jwt.verify(token, 'mlooIhoZufdeZFc6daUpdh1eXvbAJ6vXdArTr4yDQ3uPdp1', (err, decode) => {
        if (err) {
            console.error(err);
            return next(new Error("Authentication error"));
        }
        const { id, name } = decode;
        // Store user info securely, avoid exposing sensitive data to client
        socket.authData = { userId: id, name };
        // Check if user already exists
        const existingUserIndex = onlineUsers.findIndex(user => user.userId === id);
        if (existingUserIndex !== -1) {
            // Update socket ID for existing user
            onlineUsers[existingUserIndex].socketId = socket.id;
        } else {
            // Store connected user information
            onlineUsers.push({ socketId: socket.id, userId: id, name });
        }
        next();
    });
};

io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    authenticateUser(socket, token, next);
})

const setMessage = async (chatData) => {
    const db = await connectDatabase();
    const chat_colletion = db.collection("chats")

    const result = await chat_colletion.updateOne(
        {
            "participants.sender_id": chatData.participants.sender_id,
            "participants.receiver_id": chatData.participants.receiver_id
        },
        {
            $set: {
                "participants.sender_id": chatData.participants.sender_id,
                "participants.receiver_id": chatData.participants.receiver_id,
                "is_seen_message": chatData.is_seen_message
            },
            $push: {
                "messages": chatData.messages
            }
        },
        {
            upsert: true
        }
    );

    return result
}

io.on('connection', async (socket) => {

    socket.on("get_online_users", () => {
        io.emit("get_online_users", onlineUsers)
    });
    socket.on("new_message", async ({ messageText, receiver, sender, newMessage }) => {
        const isOnlineReceiver = onlineUsers.find(user => user.userId === receiver._id);

        const participantsIds = [sender._id, receiver._id];
        participantsIds.sort(); // Sorting IDs alphabetically
        const chatData =
        {
            participants: {
                sender_id: participantsIds[0],
                receiver_id: participantsIds[1]
            },
            messages: newMessage,
            is_seen_message: [
                {
                    participant_id: sender._id,
                    seen: false
                },
                {
                    participant_id: receiver._id,
                    seen: false
                }
            ]
        }
        setMessage(chatData)
            .then(res => {
                if (res.acknowledged) {

                    isOnlineReceiver && io.to(isOnlineReceiver.socketId).emit("new_message",
                        {
                            messageText, sender: { userId: socket.authData.userId, name: socket.authData.name }
                        });
                }
            })
    });

    socket.on('typing', ({ isTyping, receiver }) => {
        const isOnlineReceiver = onlineUsers.find(user => user.userId === receiver._id);
        isOnlineReceiver &&
            socket.to(isOnlineReceiver.socketId).emit('typing', isTyping);
    });

    socket.on("disconnect", () => {
        onlineUsers = onlineUsers.filter((user) => user.socketId !== socket.id)
        // send all online users to all users
        io.emit("get_online_users", onlineUsers);
    });

    socket.on("offline", () => {
        // remove user from active users
        onlineUsers = onlineUsers.filter((user) => user.socketId !== socket.id)
        // send all online users to all users
        io.emit("get_online_users", onlineUsers);
    });
})

module.exports = { app, server }
