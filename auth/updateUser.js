const { onRequest } = require("firebase-functions/v2/https");
const { getAuth } = require("firebase-admin/auth");
const cors = require('cors')({ origin: true });

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
            if (error.code === 'auth/user-not-found') {
                res.status(404).send({ success: false, error: "User not found." });
            } else {
                console.error("Error updating user:", error);
                res.status(500).send({ status: 'Internal Server Error', error: error });
            }
        }
    });
});