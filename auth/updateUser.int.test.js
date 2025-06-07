const { getAuth } = require('firebase-admin/auth');
const { expect } = require('chai');
const request = require('supertest');
const express = require('express');
const { updateUser } = require('./updateUser');

const auth = getAuth();

const app = express();
app.use(express.json());
app.use('/updateUser', updateUser);

exports.updateUserIntTest = function () {
    describe('PATCH /updateUser', () => {
        let testUserUid;
        const testUserData = {
            "email": "integration.test.user@mailinator.com",
            "password": "123456",
            "photoURL": "https://i.pinimg.com/1200x/95/f2/dc/95f2dcf5f17c59125547cc391a15f48e.jpg"
        };
        const updTestUserData = {
            "uid": testUserUid,
            "updateData": {
                "photoUrl": "https://img.freepik.com/premium-vector/person-with-blue-shirt-that-says-name-person_1029948-7040.jpg?semt=ais_hybrid&w=740"
            }
        };

        beforeEach(async () => {
            const testUser = await auth.createUser(testUserData);
            testUserUid = testUser.uid;
            updTestUserData.uid = testUserUid;
        });

        afterEach(async () => {
            if (testUserUid) auth.deleteUser(testUserUid);
        });

        it("should handle OPTIONS preflight request with appropriate CORS headers", async () => {
            const res = await request(app)
                .options('/updateUser')
                .set('Origin', 'http://example.com');

            expect(res.status).to.be.oneOf([200, 204]);
            expect(res.headers).to.have.property('access-control-allow-origin');
            expect(res.headers['access-control-allow-origin']).to.equal('http://example.com');
        });

        it("should return 200 if user is updated successfully", async () => {
            const res = await request(app)
                .patch('/updateUser')
                .set('Content-Type', 'application/json')
                .send(updTestUserData);

            expect(res.status).to.equal(200);
            expect(res.body).to.have.property('success', true);
            expect(res.body).to.have.property('message', 'User updated successfully.');
            expect(res.body).to.have.property('user');

            const userRecord = await auth.getUser(updTestUserData.uid);
            expect(userRecord.photoURL).to.equal(updTestUserData.updateData.photoUrl);            
        });

        it("should return 400 if uid param is missing from payload", async () => {
            delete testUserData.uid;

            const res = await request(app)
                .patch('/updateUser')
                .set('Content-Type', 'application/json')
                .send(testUserData);

            expect(res.status).to.equal(400);
        });

        it("should return 400 if updateData param is missing from payload", async () => {
            delete testUserData.updateData;

            const res = await request(app)
                .patch('/updateUser')
                .set('Content-Type', 'application/json')
                .send(testUserData);

            expect(res.status).to.equal(400);
        });

        it("should return 400 if uid and updateData param are missing from payload", async () => {
            delete testUserData.uid;
            delete testUserData.updateData;

            const res = await request(app)
                .patch('/updateUser')
                .set('Content-Type', 'application/json')
                .send(testUserData);

            expect(res.status).to.equal(400);
        });

        it("should return 400 if content-type is not application/json", async () => {
            const res = await request(app)
                .patch('/updateUser')
                .set('Content-Type', 'application/x-www-form-urlencoded')
                .send(updTestUserData);

            expect(res.status).to.equal(400);
        });

        it("should return 404 if user does not exist ", async () => {
            const res = await request(app)
                .delete('/deleteUser')
                .send({ uid: 'nonexistent-id-123456' })

            expect(res.status).to.equal(404);
        });

        it("should return 405 if req method is not PATCH", async () => {
            const res = await request(app)
                .post('/updateUser')
                .set('Content-Type', 'application/json')
                .send(updTestUserData);

            expect(res.status).to.equal(405);
        });

        it("should return 500 if serverside fails", function () {
            console.warn("⚠️ Still TBA:");
            this.skip();
        });
    });
};