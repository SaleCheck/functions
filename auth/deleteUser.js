const { onRequest } = require('firebase-functions/v2/https');
const { getAuth } = require('firebase-admin/auth');
const cors = require('cors')({ origin: true });

exports.deleteUser = onRequest(async (req, res) => {
    cors(req, res, async () => {
        if (req.method !== 'DELETE') return res.status(405).send({ success: false, error: 'Method Not Allowed. Only DELETE requests are allowed.' });
        if (req.get('Content-Type') !== 'application/json') return res.status(400).send({ success: false, error: 'Content-Type must be application/json.' });

        const { uid } = req.body;
        if (!uid) return res.status(400).send({ success: false, error: 'Bad Request: \'uid\' is required in the payload.' });

        try {
            await getAuth().deleteUser(uid);
            res.status(200).send({ success: true, message: 'User deleted successfully.' });
        } catch (error) {
            if (error.code === 'auth/user-not-found') {
                res.status(404).send({ success: false, error: 'User not found.' });
            } else {
                console.error('Error deleting user:', error);
                res.status(500).send({ status: 'Internal Server Error', error: error });
            }
        }
    });
});
