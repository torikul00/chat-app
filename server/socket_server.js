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
            // Filter condition using $elemMatch to match both sender_id and receiver_id
            $and: [
                { "participants.sender_id": chatData.participants[0].sender_id },
                { "participants.receiver_id": chatData.participants[1].receiver_id }
            ]
        },
        {
            // Update operation
            $setOnInsert: {  // Ensure participants field is set on insert
                participants: chatData.participants,
            },
            $push: {  // Push message to messages array
                messages: chatData.messages
            }
        },
        {
            upsert: true // Insert new document if no match is found
        }
    );


    return result
}

io.on('connection', async (socket) => {

    socket.on("get_online_users", () => {
        io.emit("get_online_users", onlineUsers)
    });
    socket.on("new_message", async ({ messageText, receiver, sender, newMessage }) => {

        const isOnlineReceiver = onlineUsers.find(user => user.userId === receiver.id);
        const participants = [sender, receiver].sort((a, b) => a.id.localeCompare(b.id));

        const chatData =
        {
            participants: [
                {
                    sender_id: participants[0].id,
                    id: participants[0].id,
                    name: participants[0].name,
                    image: participants[0].image,
                    seen: false
                },
                {
                    receiver_id: participants[1].id,
                    id: participants[1].id,
                    name: participants[1].name,
                    image: participants[1].image,
                    seen: false
                }
            ],
            messages: newMessage,

        }
        setMessage(chatData)
            .then(res => {
                console.log(res);
                if (res.acknowledged) {
                    const isOnlineSender = onlineUsers.find(user => user.userId === sender.id);
                    if (isOnlineSender) {
                        io.to(isOnlineSender.socketId).emit("message_sent");
                    }
                    if (isOnlineReceiver) {
                        io.to(isOnlineReceiver.socketId).emit("new_message", { messageText, receiver_id: receiver.id, sender_id: sender.id });
                    }
                }
            })
    });

    socket.on('typing', ({ isTyping, receiver_id, sender_id }) => {
        const isOnlineReceiver = onlineUsers.find(user => user.userId === receiver_id);
        isOnlineReceiver &&
            socket.to(isOnlineReceiver.socketId).emit('typing', { isTyping, sender_id });
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
