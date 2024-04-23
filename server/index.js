const express = require('express');
const cookieParser = require("cookie-parser");
const { app, server } = require('./socket_server')
const cors = require('cors');
const port = process.env.PORT || 5000;
const path = require('path')
require('dotenv').config();

app.use(express.static('public'))
app.use(cors({
    origin: [process.env.CLIENT_URL],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
    exposedHeaders: ["set-cookie"],
}))
app.use(cookieParser());

const all_users_api = require("./src/routes/all_users_api")
const chat_api = require("./src/routes/chat_api")

app.use(express.json({ limit: '1000mb' }));
app.use('/uploads/screenshots', express.static(path.join(__dirname, 'uploads/screenshots')));

app.use(`/all_users_api`, all_users_api)
app.use(`/chat_api`, chat_api)

app.get('/', (req, res) => {
    res.send(`Dev tracker server Running`);
})
server.listen(port, () => {
    console.log(`express and Socket server Running In PORT : ${port}`);
})
