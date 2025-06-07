const { onRequest } = require("firebase-functions/v2/https");
const { getAuth } = require("firebase-admin/auth");
const cors = require('cors')({ origin: true });

if (process.env.FUNCTIONS_EMULATOR === 'true') {
    console.log('Active emulator instance detected. Connecting to Auth emulator ...');
    try {
        process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
        console.log('... Auth emulator connection successfully established');
    } catch {
        console.error('Failed to connect to Auth emulator:', err);
        throw new Error('Failed to connect to Auth emulator');
    }
}

exports.updateUser = onRequest(async (req, res) => {
    cors(req, res, async () => {
        if (req.method !== "PATCH") return res.status(405).send({ success: false, error: 'Method Not Allowed. Only PATCH requests are allowed.' });
        if (req.get('Content-Type') !== 'application/json') return res.status(400).send({ success: false, error: 'Content-Type must be application/json.' });

        const { uid, updateData } = req.body;
        if (!uid || !updateData) return res.status(400).send({ success: false, error: "Bad Request: 'uid' and 'updateData' are required in the payload." });

        try {
            const updatedUser = await getAuth().updateUser(uid, updateData);
            res.status(200).send({ success: true, message: "User updated successfully.", user: updatedUser.toJSON() });
        } catch (error) {
            console.error("Error updating user:", error);
            res.status(500).send({ success: false, error: "Internal Server Error", details: error.message });
        }
    });
});