const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');
const { expect } = require('chai');

const auth = getAuth();
const db = getFirestore();

exports.copyUserObjectToFirestoreIntTest = function () {
    describe('copyUserObjectToFirestore', () => {
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

            // Expect trigger and complete of copyUserObjectToFirestore to take max 1000 ms
            await new Promise((resolve) => setTimeout(resolve, 1000));
        });

        afterEach(async () => {
            if (testUserUid) {
                await auth.deleteUser(testUserUid);
                await db.collection('users').doc(testUserUid).delete();
            }
        });

        it('should copy new auth user to Firestore users collection', async () => {
            const userDoc = await db.collection('users').doc(testUserUid).get();
            const userSnapshot = userDoc.data();

            expect(userDoc.exists).to.be.true;
            expect(userSnapshot).to.include({
                uid: testUserUid,
                disabled: testUserData.disabled,
                displayName: testUserData.displayName,
                email: testUserData.email,
                emailVerified: testUserData.emailVerified,
                phoneNumber: testUserData.phoneNumber,
                photoURL: testUserData.photoURL
            })

            expect(userSnapshot.createdOn).to.exist;
            expect(userSnapshot.lastUpdated).to.exist;
        });
    });
};