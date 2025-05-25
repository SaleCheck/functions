const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
const { expect } = require('chai');
const request = require('supertest');
const express = require('express');
const ALLOWED_FIELDS = require("./config/productsFirestoreStructureConfig.json");
const { createProductToCheck } = require('./createProductToCheck');

const db = getFirestore();
// db.settings({ host: process.env.FIRESTORE_EMULATOR_HOST, ssl: false });

const app = express();
app.use(express.json());
app.use('/createProductToCheck', createProductToCheck);

exports.createProductToCheckIntTest = function () {
    describe('POST /createProductToCheck', () => {
        let testProductId;
        const testProductData = {
            "data": {
                "productName": "ExampleProduct",
                "expectedPrice": 29.99,
                "expectedPriceCurrency": "USD",
                "url": "http: //example.com/product",
                "emailNotification": [
                    "user1@example.com",
                    "user2@example.com"
                ],
                "cssSelector": ".product-price",
                "user": "YlGEGBCRfBV6o3TIUrTqvcdMxMi2"
            }
        };

        after(async () => {
            if (testProductId) await db.collection("productsToCheck").doc(testProductId).delete();
        });

        it("should handle OPTIONS preflight request with appropriate CORS headers", async () => {
            const res = await request(app)
                .options('/createProductToCheck')
                .set('Origin', 'http://example.com');

            expect(res.status).to.be.oneOf([200, 204]);
            expect(res.headers).to.have.property('access-control-allow-origin');
            expect(res.headers['access-control-allow-origin']).to.equal('http://example.com');
        });

        it("should return 200 if product successfully created", async () => {
            const res = await request(app)
                .post('/createProductToCheck')
                .set('Content-Type', 'application/json')
                .send(testProductData);

            expect(res.status).to.equal(200);
            expect(res.body).to.have.property('message', 'Product added successfully');
            expect(res.body).to.have.property('documentId');

            testProductId = res.body.documentId; // also needed for test teardown;
            const docRef = db.collection("productsToCheck").doc(testProductId);
            const docSnap = await docRef.get();

            expect(docSnap.exists).to.be.true;
            for (const key of Object.keys(testProductData.data)) {
                expect(docSnap.data()[key]).to.deep.equal(testProductData.data[key]);
            }
            expect(docSnap.data()).to.have.property('createdTimestamp');
            expect(docSnap.data()).to.have.property('lastUpdated');

            expect(docSnap.data().createdTimestamp).to.be.an.instanceOf(admin.firestore.Timestamp);
            expect(docSnap.data().lastUpdated).to.be.an.instanceOf(admin.firestore.Timestamp);
        });

        it("should return 400 if content-type is not application/json", async () => {
            const res = await request(app)
                .post('/createProductToCheck')
                .set('Content-Type', 'application/x-www-form-urlencoded')
                .send(testProductData);

            expect(res.status).to.equal(400);
        });

        it("should return 400 if payload is empty", async () => {
            const res = await request(app)
                .post('/createProductToCheck')
                .set('Content-Type', 'application/json')
                .send({});

            expect(res.status).to.equal(400);
        });

        it("should return 400 if payload is missing any expected params", async () => {
            for (const key of ALLOWED_FIELDS) {
                const incompletePayload = JSON.parse(JSON.stringify(testProductData));
                delete incompletePayload.data[key];

                const res = await request(app)
                    .post('/createProductToCheck')
                    .set('Content-Type', 'application/json')
                    .send(incompletePayload);

                expect(res.status).to.equal(400);
                expect(res.body).to.have.property('error');
                expect(res.body.error).to.include(`Missing field ${key}`);
            }
        });

        it("should return 405 if req method is not POST", async () => {
            const res = await request(app)
                .get('/createProductToCheck')
                .set('Content-Type', 'application/json')
                .send(testProductData);

            expect(res.status).to.equal(405);
        });

        it("should ignore keys in payload not allowed in productsFirestoreStructureConfig", async () => {
            const invalidFields = {
                "invalidKey1": "value1",
                "invalidKey2": 12345,
                "invalidKey3": { nested: "object" }
            };

            const testProductDataWithInvalids = {
                data: {
                    ...testProductData.data,
                    ...invalidFields
                }
            };

            const res = await request(app)
                .post('/createProductToCheck')
                .set('Content-Type', 'application/json')
                .send(testProductDataWithInvalids);

            expect(res.status).to.equal(200);
            expect(res.body).to.have.property('message', 'Product added successfully');
            expect(res.body).to.have.property('documentId');

            testProductId = res.body.documentId; // also needed for test teardown;
            const updatedDocSnap = await db.collection("productsToCheck").doc(testProductId).get();
            const updatedDocData = updatedDocSnap.data();

            for (const key of Object.keys(testProductDataWithInvalids.data)) {
                if (ALLOWED_FIELDS.includes(key)) {
                    expect(updatedDocData).to.have.property(key);
                    expect(updatedDocData[key]).to.deep.equal(testProductDataWithInvalids.data[key]);
                } else if (!(ALLOWED_FIELDS.includes(key))) {
                    expect(updatedDocData).to.not.have.property(key);
                } else {
                    throw new Error(`Unexpected key ${key} encountered while validating created product data`);
                }
            }

            expect(updatedDocData).to.have.property('createdTimestamp');
            expect(updatedDocData).to.have.property('lastUpdated');
        });

        it("should return 500 if adding to Firestore fails ", function () {
            console.warn("⚠️ Still TBA:");
            this.skip();
        });
    });
};