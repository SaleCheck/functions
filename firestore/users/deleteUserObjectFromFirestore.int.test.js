const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');
const { getStorage } = require('firebase-admin/storage');
const { expect } = require('chai');
const { _test } = require('./deleteUserObjectFromFirestore');

const auth = getAuth();
const db = getFirestore();
const storage = getStorage();

exports.deleteUserObjectFromFirestoreIntTest = () => {
    describe('deleteUserObjectFromFirestore', function () {
        this.timeout(5000);

        let testUserUid;
        let storageFilePath;

        const testUserData = {
            disabled: false,
            displayName: 'Test User',
            email: 'integration.test.user@mailinator.com',
            emailVerified: false,
            password: '123456',
            phoneNumber: '+1234567890',
            photoURL: 'https://i.pinimg.com/1200x/95/f2/dc/95f2dcf5f17c59125547cc391a15f48e.jpg'
        };

        beforeEach(async () => {
            const user = await auth.createUser(testUserData);
            testUserUid = user.uid;

            // Create Firestore doc (since trigger is no longer relied upon)
            await db.collection('users').doc(testUserUid).set({
                uid: testUserUid
            });

            // Create storage file
            const bucket = storage.bucket();
            storageFilePath = `users/avatar/${testUserUid}/${testUserUid}.png`;
            const file = bucket.file(storageFilePath);

            await file.save(Buffer.from('test file'), {
                contentType: 'image/png'
            });
        });

        afterEach(async () => {
            if (testUserUid) {
                await auth.deleteUser(testUserUid).catch(() => {});
                await db.collection('users').doc(testUserUid).delete().catch(() => {});
            }

            if (storageFilePath) {
                const file = storage.bucket().file(storageFilePath);
                const [exists] = await file.exists();
                if (exists) await file.delete();
            }
        });

        it('should delete user from Firestore and Storage', async () => {
            await _test.deleteUserData({ uid: testUserUid });

            const userDoc = await db.collection('users').doc(testUserUid).get();
            expect(userDoc.exists).to.be.false;

            const file = storage.bucket().file(storageFilePath);
            const [exists] = await file.exists();
            expect(exists).to.be.false;
        });

        it('should handle missing Firestore document gracefully', async () => {
            await db.collection('users').doc(testUserUid).delete();

            await _test.deleteUserData({ uid: testUserUid });

            const userDoc = await db.collection('users').doc(testUserUid).get();
            expect(userDoc.exists).to.be.false;

            const file = storage.bucket().file(storageFilePath);
            const [exists] = await file.exists();
            expect(exists).to.be.false;
        });

        it('should handle missing storage files gracefully', async () => {
            const file = storage.bucket().file(storageFilePath);
            await file.delete();

            await _test.deleteUserData({ uid: testUserUid });

            const userDoc = await db.collection('users').doc(testUserUid).get();
            expect(userDoc.exists).to.be.false;

            const [exists] = await file.exists();
            expect(exists).to.be.false;
        });

        it('should delete multiple avatar files', async () => {
            const bucket = storage.bucket();

            const file1 = bucket.file(`users/avatar/${testUserUid}/${testUserUid}.png`);
            const file2 = bucket.file(`users/avatar/${testUserUid}/extra-file.png`);

            await file2.save(Buffer.from('extra file'), {
                contentType: 'image/png'
            });

            await _test.deleteUserData({ uid: testUserUid });

            const [exists1] = await file1.exists();
            const [exists2] = await file2.exists();

            expect(exists1).to.be.false;
            expect(exists2).to.be.false;
        });
    });
};