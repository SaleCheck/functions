const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');
const { getStorage } = require("firebase-admin/storage");
const { expect } = require('chai');

const auth = getAuth();
const db = getFirestore();
const storage = getStorage();

exports.deleteUserObjectFromFirestoreIntTest =  () => {
    describe('deleteUserObjectFromFirestore', function () {
        this.timeout(5000);

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

        it('should delete user from collection in Firestore and avatar in Storage', async () => {
            await auth.deleteUser(testUserUid);
            await new Promise((resolve) => setTimeout(resolve, 2000)); // Set target for completion time of deleteUserObjectFromFirestore

            const userDoc = await db.collection('users').doc(testUserUid).get();
            expect(userDoc.exists).to.be.false;

            const bucket = storage.bucket();
            const file = bucket.file(storageFilePath);
            const [exists] = await file.exists();
            expect(exists).to.be.false;
        })

        it('should handle user document not existing gracefully', async () => {
            // Delete user document before deleting user account
            await db.collection('users').doc(testUserUid).delete();

            await auth.deleteUser(testUserUid);
            await new Promise((resolve) => setTimeout(resolve, 2000));

            const userDoc = await db.collection('users').doc(testUserUid).get();
            expect(userDoc.exists).to.be.false;

            const bucket = storage.bucket();
            const file = bucket.file(storageFilePath);
            const [exists] = await file.exists();
            expect(exists).to.be.false;
        });

        it('should handle no avatar files in storage gracefully', async () => {
            // Delete avatar file before deleting user account
            const bucket = storage.bucket();
            const file = bucket.file(storageFilePath);
            await file.delete();

            await auth.deleteUser(testUserUid);
            await new Promise((resolve) => setTimeout(resolve, 2000));

            const userDoc = await db.collection('users').doc(testUserUid).get();
            expect(userDoc.exists).to.be.false;

            const [exists] = await file.exists();
            expect(exists).to.be.false;
        });

        it('should delete all avatar files if multiple exist', async () => {
            const bucket = storage.bucket();
            const file1 = bucket.file(`users/avatar/${testUserUid}/${testUserUid}.png`);
            const file2 = bucket.file(`users/avatar/${testUserUid}/extra-file.png`);
            const buffer = Buffer.from("Extra file");
            await file2.save(buffer, { contentType: 'image/png' });

            await auth.deleteUser(testUserUid);
            await new Promise((resolve) => setTimeout(resolve, 3000));

            const userDoc = await db.collection('users').doc(testUserUid).get();
            expect(userDoc.exists).to.be.false;

            const [exists1] = await file1.exists();
            const [exists2] = await file2.exists();
            expect(exists1).to.be.false;
            expect(exists2).to.be.false;
        });
    });
};