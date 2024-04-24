const express = require("express")
const router = express.Router()
const connectDatabase = require('../config/connectDatabase')
const bcrypt = require('bcrypt')
const jwt = require("jsonwebtoken")
const verifyJWT = require("../middlewares/verifyJWT")
const run = async () => {
    const db = await connectDatabase()
    const all_users_collection = db.collection("users")

    router.get('/all_users', async (req, res) => {
        try {
            const result = await all_users_collection.find().toArray()
            res.status(200).send({ message: "Get all users", all_users: result })
        }
        catch (error) {
            res.status(500).send({ message: "Internal server error" })
        }
    })
    // signup users
    router.get('/all_users_with_convo', async (req, res) => {
        try {

            const { sender_id, receiver_id } = req.query
            const participantsIds = [sender_id, receiver_id]
            participantsIds.sort()

            // Aggregation pipeline
            const pipeline = [
                {
                    $match: {
                        "participants.sender_id": participantsIds[0],
                        "participants.receiver_id": participantsIds[1]
                    },
                },
                { $unwind: "$messages" },
                { $sort: { "messages.time_stamp": -1 } },
                {
                    $group: {
                        _id: "$participants.participant_id",
                        latestMessage: { $first: "$messages" },
                        participant: { $first: "$participants" }
                    }
                },
                {
                    $project: {
                        "_id": 0,
                        "participant": 1,
                        "latestMessage": 1
                    }
                }
            ];

            const result = await all_users_collection.aggregate(pipeline).toArray();

            res.status(200).send({ message: "Get all users with latest message", usersWithLatestMessage: result });
        } catch (error) {
            console.error("Error:", error);
            res.status(500).send({ message: "Internal server error" });
        }
    });

    router.post('/signup', async (req, res) => {
        try {
            const { name, email, password } = req.body
            const hashedPassword = await bcrypt.hash(password, 10)
            const user = await all_users_collection.findOne({ email: email })
            if (user) {
                return res.status(203).send({ message: "User already exists" })
            }
            else {
                await all_users_collection.insertOne({ name, email, password: hashedPassword })
                res.status(201).send({ message: "User created" })
            }
        }
        catch (error) {
            console.log(error);
            res.status(500).send({ message: "Internal server error" })
        }
    })

    // login useers
    router.post('/login', async (req, res) => {
        try {
            const { email, password } = req.body
            const user = await all_users_collection.findOne({ email: email })
            if (!user) {
                return res.status(203).send({ message: "User does not exist" })
            }
            const isPasswordCorrect = await bcrypt.compare(password, user.password)
            if (!isPasswordCorrect) {
                return res.status(203).send({ message: "Password is incorrect" })
            }
            const token = jwt.sign({ email: user.email, id: user._id, name: user.name }, 'mlooIhoZufdeZFc6daUpdh1eXvbAJ6vXdArTr4yDQ3uPdp1', {
                expiresIn: "30d"
            })
            res.status(200).send({ user, token, message: "Login successful" })
        }
        catch (error) {
            console.log(error);
            res.status(500).send({ message: "Internal server error" })
        }
    })

    // get user
    router.get('/get_user', verifyJWT, async (req, res) => {
        try {
            const token = req.headers.authorization.split(" ")[1]
            const decodedData = jwt.verify(token, 'mlooIhoZufdeZFc6daUpdh1eXvbAJ6vXdArTr4yDQ3uPdp1')
            const user = await all_users_collection.findOne({ email: decodedData.email }, { projection: { password: 0 } })
            if (!user) {
                return res.status(204).send({ message: "User not found" })
            }
            res.status(200).send({ user })
        }
        catch (error) {
            console.log(error);
            res.status(500).send({ message: "Internal server error sdsdg" })
        }
    })
}
run()
module.exports = router;

