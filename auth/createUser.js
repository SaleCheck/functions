const { onRequest } = require("firebase-functions/v2/https");
const { getAuth } = require("firebase-admin/auth");
const cors = require('cors')({ origin: true });

exports.createUser = onRequest({ timeoutSeconds: 300, memory: "1GiB" }, async (req, res) => {
    cors(req, res, async () => {
        if (req.method !== "POST") return res.status(405).send({ success: false, error: 'Method Not Allowed. Only POST requests are allowed.' });
        if (req.get('Content-Type') !== 'application/json') return res.status(400).send({ success: false, error: 'Content-Type must be application/json.' });

        const { email, password, displayName, photoURL } = req.body.data;
        if (!email || !password) return res.status(400).send({ error: 'Bad Request: Email and password are required' });

        try {
            const userData = { email, password };
            if (displayName) userData.displayName = displayName;
            if (photoURL) userData.photoURL = photoURL;
            
            const user = await getAuth().createUser(userData);

            return res.status(201).send({ status: "Success", uid: user.uid, userAuthObject: user });
        } catch (error) {
            console.error("Error creating user: ", error);
            return res.status(500).send({ status: 'Internal Server Error', error: error });
        }
    });
});
