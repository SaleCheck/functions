const { getAuth } = require('firebase-admin/auth');
const { getFirestore, Timestamp } = require('firebase-admin/firestore');
const { expect } = require('chai');
const admin = require('firebase-admin');

const auth = getAuth();
const db = getFirestore();
const WAIT_MS = 3000;

exports.copyUserObjectToFirestoreIntTest = () => {
    describe('copyUserObjectToFirestore', function () {
        this.timeout(5000);
        
        let testUserUid;
        const defaultUserData = {
            disabled: false,
            displayName: 'Test User',
            email: "integration.test.user@mailinator.com",
            emailVerified: false,
            password: "123456",
            phoneNumber: "+1234567890",
            photoURL: "https://i.pinimg.com/1200x/95/f2/dc/95f2dcf5f17c59125547cc391a15f48e.jpg"
        };

        async function createTestUser(overrides = {}) {
            const user = await auth.createUser({ ...defaultUserData, ...overrides });
            testUserUid = user.uid;
            await new Promise(resolve => setTimeout(resolve, WAIT_MS));
            return user;
        }

        async function deleteTestUserAndDoc(uid) {
            if (uid) {
                await auth.deleteUser(uid);
                await db.collection('users').doc(uid).delete();
            }
        }

        afterEach(async () => {
            if (testUserUid) {
                await auth.deleteUser(testUserUid);
                await db.collection('users').doc(testUserUid).delete();
            }
        });

        it('should copy new auth user to Firestore users collection', async () => {
            const user = await createTestUser();

            const userDoc = await db.collection('users').doc(user.uid).get();
            const userSnapshot = userDoc.data();

            expect(userDoc.exists).to.be.true;
            expect(userSnapshot).to.include({
                uid: user.uid,
                disabled: defaultUserData.disabled,
                displayName: defaultUserData.displayName,
                email: defaultUserData.email,
                emailVerified: defaultUserData.emailVerified,
                phoneNumber: defaultUserData.phoneNumber,
                photoURL: defaultUserData.photoURL
            });

            expect(userSnapshot.createdOn).to.be.an.instanceOf(admin.firestore.Timestamp);
            expect(userSnapshot.lastUpdated).to.be.an.instanceOf(admin.firestore.Timestamp);
        });
        
        it('should have timestamps close to user creation time', async () => {
            const startTime = Date.now();
            const user = await createTestUser();
            const endTime = Date.now();

            const doc = await db.collection('users').doc(user.uid).get();
            const data = doc.data();

            const created = data.createdOn.toMillis();
            const updated = data.lastUpdated.toMillis();

            expect(created).to.be.within(startTime, endTime + 5000);
            expect(updated).to.be.within(startTime, endTime + 5000);
        });
        
        it('should handle missing optional fields gracefully', async () => {
            const user = await createTestUser({
                displayName: undefined,
                phoneNumber: undefined,
                photoURL: undefined
            });

            const userDoc = await db.collection('users').doc(user.uid).get();
            const userSnapshot = userDoc.data();

            expect(userDoc.exists).to.be.true;
            expect(userSnapshot.displayName).to.be.null;
            expect(userSnapshot.phoneNumber).to.be.null;
            expect(userSnapshot.photoURL).to.be.null;
        });

        it('should support creating user with edge-case input formats', async () => {
            const user = await createTestUser({
                email: 'edge.case.user@mailinator.com',
                phoneNumber: '+10000000001'
            });

            const doc = await db.collection('users').doc(user.uid).get();
            expect(doc.exists).to.be.true;
            expect(doc.data().phoneNumber).to.equal('+10000000001');
        });
    });
};
