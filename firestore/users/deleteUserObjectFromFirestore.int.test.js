const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');
const { getStorage } = require("firebase-admin/storage");
const { expect } = require('chai');

const auth = getAuth();
const db = getFirestore();
const storage = getStorage();

exports.deleteUserObjectFromFirestoreIntTest = function () {
    describe('deleteUserObjectFromFirestore', () => {
        let testUserUid;
        const testUserData = {
            disabled: false,
            displayName: 'Test User',
            email: "integration.test.user@mailinator.com",
            emailVerified: false,
            password: "123456",
            phoneNumber: "+1234567890",
            photoURL: "https://i.pinimg.com/1200x/95/f2/dc/95f2dcf5f17c59125547cc391a15f48e.jpg"
        };

        beforeEach(async () => {
            const testUser = await auth.createUser(testUserData);
            testUserUid = testUser.uid;

            const bucket = storage.bucket();
            storageFilePath = `/users/avatar/${testUserUid}/${testUserUid}.png`;
            const buffer = Buffer.from("This is a test file for deletion.");
            const file = bucket.file(storageFilePath);
            await file.save(buffer, { contentType: 'image/png', });

            await new Promise((resolve) => setTimeout(resolve, 1000)); // Set target for completion time of copyUserObjectToFirestore
        });

        afterEach(async () => {
            if (testUserUid) await auth.getUser(testUserUid)
                .then(() => auth.deleteUser(testUserUid))
                .catch(error => {
                    if (error.code !== 'auth/user-not-found') throw error;
                });

            if (storageFilePath) {
                const bucket = storage.bucket();
                const file = bucket.file(storageFilePath);
                const [exists] = await file.exists();
                if (exists) await file.delete();
            }
        });

        it('should delete user from collection in Firestore and avatar in Storage', async function () {
            this.timeout(5000);

            await auth.deleteUser(testUserUid);
            await new Promise((resolve) => setTimeout(resolve, 2000)); // Set target for completion time of deleteUserObjectFromFirestore

            const userDoc = await db.collection('users').doc(testUserUid).get();
            expect(userDoc.exists).to.be.false;

            const bucket = storage.bucket();
            const file = bucket.file(storageFilePath);
            const [exists] = await file.exists();
            expect(exists).to.be.false;
        })
    });
};