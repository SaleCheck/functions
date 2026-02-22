const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');
const { expect } = require('chai');
const request = require('supertest');
const express = require('express');
const sinon = require('sinon');
const { deleteUser } = require('./deleteUser');

const auth = getAuth();
const db = getFirestore();

const app = express();
app.use(express.json());
app.use('/deleteUser', deleteUser);

exports.deleteUserIntTest = () => {
    describe('DELETE /deleteUser', () => {
        let testUserUid;
        const testUserData = {
            'email': 'integration.test.user@mailinator.com',
            'password': '123456',
            'photoURL': 'https://i.pinimg.com/1200x/95/f2/dc/95f2dcf5f17c59125547cc391a15f48e.jpg'
        };

        before(async () => {
            const testUser = await auth.createUser(testUserData);
            testUserUid = testUser.uid;
        });

        after(async () => {
            if (testUserUid) {
                await auth.getUser(testUserUid)
                    .then(() => auth.deleteUser(testUserUid))
                    .catch(error => {
                        if (error.code !== 'auth/user-not-found') throw error;
                    });

                try {
                    await db.collection('users').doc(testUserUid).delete();
                } catch (firestoreError) {
                    console.warn(`Failed to delete Firestore doc: ${firestoreError.message}`);
                }
            }
        });

        it('should handle OPTIONS preflight request with appropriate CORS headers', async () => {
            const res = await request(app)
                .options('/deleteUser')
                .set('Origin', 'http://example.com');

            expect(res.status).to.be.oneOf([200, 204]);
            expect(res.headers).to.have.property('access-control-allow-origin');
            expect(res.headers['access-control-allow-origin']).to.equal('http://example.com');
        });

        it('should return 200 and delete from Firebase Auth', async () => {
            const res = await request(app)
                .delete('/deleteUser')
                .set('Content-Type', 'application/json')
                .send({ 'uid': testUserUid });

            expect(res.status).to.equal(200);

            try {
                const userExists = await auth.getUser(testUserUid);
                if (userExists) throw new Error('User still exists after supposed deletion');
            } catch (err) {
                expect(err.code).to.equal('auth/user-not-found');
            }
        });

        it('should return 400 if uid param is missing from payload', async () => {
            const res = await request(app)
                .delete('/deleteUser')
                .set('Content-Type', 'application/json')
                .send({ email: 'integration.test.user@mailinator.com' });

            expect(res.status).to.equal(400);
        });

        it('should return 400 if content-type is not application/json', async () => {
            const res = await request(app)
                .delete('/deleteUser')
                .set('Content-Type', 'application/x-www-form-urlencoded')
                .send({ 'uid': testUserUid });

            expect(res.status).to.equal(400);
        });

        it('should return 404 if user does not exist ', async () => {
            const res = await request(app)
                .delete('/deleteUser')
                .send({ uid: 'nonexistent-id-123456' })

            expect(res.status).to.equal(404);
        });

        it('should return 405 if req method is not DELETE', async () => {
            const res = await request(app)
                .post('/deleteUser')
                .query({ uid: testUserUid })

            expect(res.status).to.equal(405);
        });

        it('should return 500 if serverside fails', async () => {
            // Stub getAuth().deleteUser() to return a rejected Promise simulating async failure
            const getAuthStub = sinon.stub(getAuth(), 'deleteUser').rejects(new Error('Simulated server error'));
            const consoleErrorStub = sinon.stub(console, 'error');

            try {
                const res = await request(app)
                    .delete('/deleteUser')
                    .set('Content-Type', 'application/json')
                    .send({ 'uid': testUserUid });

                expect(res.status).to.equal(500);
                expect(res.body).to.have.property('status', 'Internal Server Error');
                expect(res.body).to.have.property('error');
            } finally {
                getAuthStub.restore();
                consoleErrorStub.restore();
            }
        });
    });
};