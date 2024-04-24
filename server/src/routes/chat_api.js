const express = require("express")
const router = express.Router()
const connectDatabase = require('../config/connectDatabase')
const run = async () => {
    const db = await connectDatabase()
    const chat_collection = db.collection("chats")

    router.get("/get_all_chats", async (req, res) => {
        try {
            const { userId } = req.query;
            
            const chats = await chat_collection.aggregate([
                {
                    $match: {
                        $or: [
                            { "participants.sender_id": userId },
                            { "participants.receiver_id": userId }
                        ]
                    }
                },
                {
                    $addFields: {
                        last_message: { $arrayElemAt: ["$messages", -1] } // Add last_message field with the last element of messages array
                    }
                },
                { $sort: { "last_message.time_stamp": -1 } }, // Sort the chats based on the last message time_stamp
                { $unset: "messages" }
            ]).toArray();

            if (chats.length === 0) {
                return res.status(204).json({ error: "No chats found" });
            }
            res.status(200).send({ chats });

        } catch (error) {
            console.log(error);
            return res.status(500).json({ error: error.message });
        }
    });

    router.get("/get_messages", async (req, res) => {
        try {
            const { sender_id, receiver_id, skip } = req.query;
            const participantsIds = [sender_id, receiver_id].sort();

            const chatsData = await chat_collection.aggregate([
                {
                    $match: {
                        $and: [
                            { "participants.sender_id": participantsIds[0] },
                            { "participants.receiver_id": participantsIds[1] }
                        ]
                    }
                },
                { $unwind: '$messages' },
                { $sort: { 'messages.time_stamp': -1 } },
                { $skip: parseInt(skip) },
                { $limit: 20 },

            ]).toArray();

            if (chatsData.length > 0) {
                const allChatsData = chatsData.map(entry => entry.messages).reverse();
                return res.status(200).send(allChatsData);
            } else {
                return res.status(204).send("No chat found");
            }
        } catch (error) {
            console.log(error);
            return res.status(500).json({ error: error.message });
        }
    });

}
run()

module.exports = router