const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');

const db = admin.firestore();
const bucket = admin.storage().bucket();

async function deleteUserData(user) {
    const userId = user.uid;

    // Delete Firestore document (safe even if not exists)
    const docRef = db.collection('users').doc(userId);
    await docRef.delete();

    // Delete all avatar files
    const avatarPath = `users/avatar/${userId}/`;
    const [files] = await bucket.getFiles({ prefix: avatarPath });

    if (files.length > 0) {
        await Promise.all(files.map(file => file.delete()));
    }
}

// Firebase trigger (thin wrapper)
exports.deleteUserObjectFromFirestore = functions.auth.user().onDelete(async (user) => {
    console.log('User deleted:', user.uid);
    try {
        await deleteUserData(user);
    } catch (error) {
        console.error(`Error deleting user data for uid ${user.uid}:`, error);
    }
});

// Export for testing
exports._test = { deleteUserData };