const { getAuth } = require('firebase-admin/auth');
const { expect } = require('chai');
const request = require('supertest');
const express = require('express');
const sinon = require('sinon');
const { createUser } = require('./createUser');

const auth = getAuth();

const app = express();
app.use(express.json());
app.use('/createUser', createUser);

exports.createUserIntTest = () => {
    describe('POST /createUser', () => {
        let testUserUid;
        let testUserData;

        beforeEach(async () => {
            testUserData = {
                "data": {
                    "email": "integration.test.user@mailinator.com",
                    "password": "123456"
                }
            }
        });

        afterEach(async () => {
            if (testUserUid) auth.deleteUser(testUserUid);
        });

        it("should handle OPTIONS preflight request with appropriate CORS headers", async () => {
            const res = await request(app)
                .options('/createUser')
                .set('Origin', 'http://example.com');

            expect(res.status).to.be.oneOf([200, 204]);
            expect(res.headers).to.have.property('access-control-allow-origin');
            expect(res.headers['access-control-allow-origin']).to.equal('http://example.com');
        });

        it("should return 201 and create user with only mandatory params", async () => {
            const res = await request(app)
                .post('/createUser')
                .set('Content-Type', 'application/json')
                .send(testUserData);

            expect(res.status).to.equal(201);
            expect(res.body).to.have.property('uid');
            expect(res.body).to.have.property('userAuthObject');

            testUserUid = res.body.uid; // also needed for test teardown;

            const userRecord = await auth.getUser(testUserUid);
            expect(userRecord).to.exist;
            expect(userRecord.uid).to.equal(testUserUid);
            expect(userRecord.email).to.equal(testUserData.data.email);
        });

        it("should return 201 and create user with mandatory params and displayName", async () => {
            testUserData.data.displayName = "John Doe";

            const res = await request(app)
                .post('/createUser')
                .set('Content-Type', 'application/json')
                .send(testUserData);

            expect(res.status).to.equal(201);
            expect(res.body).to.have.property('uid');
            expect(res.body).to.have.property('userAuthObject');

            testUserUid = res.body.uid; // also needed for test teardown;

            const userRecord = await auth.getUser(testUserUid);
            expect(userRecord).to.exist;
            expect(userRecord.uid).to.equal(testUserUid);
            expect(userRecord.email).to.equal(testUserData.data.email);
            expect(userRecord.displayName).to.equal(testUserData.data.displayName);
        });

        it("should return 201 and create user with mandatory params and photoURL", async () => {
            testUserData.data.photoURL = "https://i.pinimg.com/1200x/95/f2/dc/95f2dcf5f17c59125547cc391a15f48e.jpg";

            const res = await request(app)
                .post('/createUser')
                .set('Content-Type', 'application/json')
                .send(testUserData);

            expect(res.status).to.equal(201);
            expect(res.body).to.have.property('uid');
            expect(res.body).to.have.property('userAuthObject');

            testUserUid = res.body.uid; // also needed for test teardown;

            const userRecord = await auth.getUser(testUserUid);
            expect(userRecord).to.exist;
            expect(userRecord.uid).to.equal(testUserUid);
            expect(userRecord.email).to.equal(testUserData.data.email);
            expect(userRecord.photoURL).to.equal(testUserData.data.photoURL);
        });

        it("should return 201 and create user with mandatory params and displayName and photoURL", async () => {
            testUserData.data.displayName = "John Doe";
            testUserData.data.photoURL = "https://i.pinimg.com/1200x/95/f2/dc/95f2dcf5f17c59125547cc391a15f48e.jpg";

            const res = await request(app)
                .post('/createUser')
                .set('Content-Type', 'application/json')
                .send(testUserData);

            expect(res.status).to.equal(201);
            expect(res.body).to.have.property('uid');
            expect(res.body).to.have.property('userAuthObject');

            testUserUid = res.body.uid; // also needed for test teardown;

            const userRecord = await auth.getUser(testUserUid);
            expect(userRecord).to.exist;
            expect(userRecord.uid).to.equal(testUserUid);
            expect(userRecord.email).to.equal(testUserData.data.email);
            expect(userRecord.displayName).to.equal(testUserData.data.displayName);
            expect(userRecord.photoURL).to.equal(testUserData.data.photoURL);
        });

        it("should return 400 if payload missing mandatory param email", async () => {
            delete testUserData.data.email;

            const res = await request(app)
                .post('/createUser')
                .set('Content-Type', 'application/json')
                .send(testUserData);

            expect(res.status).to.equal(400);
        });

        it("should return 400 if payload missing mandatory param password", async () => {
            delete testUserData.data.password;

            const res = await request(app)
                .post('/createUser')
                .set('Content-Type', 'application/json')
                .send(testUserData);

            expect(res.status).to.equal(400);
        });

        it("should return 400 if payload missing mandatory params email and password", async () => {
            delete testUserData.data.email;
            delete testUserData.data.password;

            const res = await request(app)
                .post('/createUser')
                .set('Content-Type', 'application/json')
                .send(testUserData);

            expect(res.status).to.equal(400);
        });

        it("should return 400 if content-type is not application/json", async () => {
            const res = await request(app)
                .post('/createUser')
                .set('Content-Type', 'application/x-www-form-urlencoded')
                .send(testUserData);

            expect(res.status).to.equal(400);
        });

        it("should return 405 if req method is not POST", async () => {
            const res = await request(app)
                .patch('/createUser')
                .set('Content-Type', 'application/json')
                .send(testUserData);

            expect(res.status).to.equal(405);
        });

        it("should return 500 if serverside fails", async () => {
            // Stub getAuth().createUser() to return a rejected Promise simulating async failure
            const getAuthStub = sinon.stub(getAuth(), 'createUser').rejects(new Error('Simulated server error'));
            const consoleErrorStub = sinon.stub(console, 'error');

            try {
                const res = await request(app)
                    .post('/createUser')
                    .set('Content-Type', 'application/json')
                    .send(testUserData);

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