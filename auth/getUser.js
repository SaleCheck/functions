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

exports.getUser = onRequest(async (req, res) => {
    cors(req, res, async () => {
        if (req.method !== "GET") return res.status(405).send({ success: false, error: 'Method Not Allowed. Only GET requests are allowed.' });

        const uid = req.query.uid;
        if (!uid) return res.status(400).send({ success: false, error: "Bag Request: 'uid' is required in the query parameters." });

        getAuth()
            .getUser(uid)
            .then((userRecord) => {
                res.status(200).send({ status: "Success", user: userRecord.toJSON() });
            })
            .catch((error) => {
                if (error.code === 'auth/user-not-found') {
                    res.status(404).send({ success: false, error: "User not found." });    
                } else {
                    console.error("Error fetching user data:", error);
                    res.status(500).send({ status: 'Internal Server Error', error: error });
                }
            });
    })
});