const express = require("express")
const router = express.Router()
const connectDatabase = require('../config/connectDatabase')
const run = async () => {
    const db = await connectDatabase()
    const chat_colletion = db.collection("chats")

    router.get("/get_chat", async (req, res) => {
        try {
            const { sender_id, receiver_id, skip } = req.query
            const participantsIds = [sender_id, receiver_id]
            participantsIds.sort()
            const chatData = await chat_colletion.aggregate([
                {
                    $match: {
                        "participants.sender_id": participantsIds[0],
                        "participants.receiver_id": participantsIds[1]
                    },
                },
                { $unwind: '$messages' },
                { $unwind: '$messages' },
                { $sort: { 'messages.time_stamp': -1 } },
                { $skip: parseInt(skip) },
                { $limit: 20 },
                { $group: { _id: '$_id', messages: { $push: '$messages' } } }

            ]).toArray()

            if (chatData) {
                const reverseData = chatData[0]?.messages?.reverse()
                return res.status(200).send(reverseData)
            }
            else {
                return res.status(204).send("No chat found")
            }
        } catch (error) {
            console.log(error);
            return res.status(500).json({ error: error.message })
        }
    })
}
run()

module.exports = router