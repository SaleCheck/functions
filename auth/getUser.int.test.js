const { getAuth } = require('firebase-admin/auth');
const { expect } = require('chai');
const request = require('supertest');
const express = require('express');
const sinon = require('sinon');
const { getUser } = require('./getUser');

const auth = getAuth();

const app = express();
app.use('/getUser', getUser);

exports.getUserIntTest = () => {
    describe('GET /getUser', () => {
        let testUserUid;
        const testUserData = {
            email: "integration.test.user@mailinator.com",
            password: "123456",
            photoURL: "https://i.pinimg.com/1200x/95/f2/dc/95f2dcf5f17c59125547cc391a15f48e.jpg"
        };

        before(async () => {
            const testUser = await auth.createUser(testUserData);
            testUserUid = testUser.uid;
        });

        after(async () => {
            if (testUserUid) auth.deleteUser(testUserUid);
        });


        it("should handle OPTIONS preflight request with appropriate CORS headers", async () => {
            const res = await request(app)
                .options('/getUser')
                .set('Origin', 'http://example.com');

            expect(res.status).to.be.oneOf([200, 204]);
            expect(res.headers).to.have.property('access-control-allow-origin');
            expect(res.headers['access-control-allow-origin']).to.equal('http://example.com');
        });

        it('should return 200 and user data for valid UID', async () => {
            const res = await request(app)
                .get('/getUser')
                .query({ uid: testUserUid })

            expect(res.status).to.equal(200);
            expect(res.body).to.have.property('status', 'Success');
            expect(res.body.user).to.have.property('uid', testUserUid);
        });

        it("should return 400 if uid param is missing from payload", async () => {
            const res = await request(app)
                .get('/getUser')
                .query({ email: "integration.test.user@mailinator.com" })

            expect(res.status).to.equal(400);
        });

        it("should return 404 if user does not exist ", async () => {
            const res = await request(app)
                .get('/getUser')
                .query({ uid: 'nonexistent-id-123456' })

            expect(res.status).to.equal(404);
        });

        it("should return 405 if req method is not GET", async () => {
            const res = await request(app)
                .post('/getUser')
                .query({ uid: testUserUid })

            expect(res.status).to.equal(405);
        });

        it("should return 500 if serverside fails", async () => {
            // Stub getAuth().getUser() to return a rejected Promise simulating async failure
            const getAuthStub = sinon.stub(getAuth(), 'getUser').rejects(new Error('Simulated server error'));
            const consoleErrorStub = sinon.stub(console, 'error');

            try {
                const res = await request(app)
                    .get('/getUser')
                    .query({ uid: testUserUid });

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