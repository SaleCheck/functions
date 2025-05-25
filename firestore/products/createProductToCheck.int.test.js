const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
const { expect } = require('chai');
const request = require('supertest');
const express = require('express');

if (!process.env.FIRESTORE_EMULATOR_HOST) throw new Error('FIRESTORE_EMULATOR_HOST is not set');
if (!admin.apps.length) admin.initializeApp({ projectId: process.env.PROJECT_ID });
const { createProductToCheck } = require('./createProductToCheck');

const db = getFirestore();
// db.settings({ host: process.env.FIRESTORE_EMULATOR_HOST, ssl: false });

const app = express();
app.use(express.json());
app.use('/createProductToCheck', createProductToCheck);

exports.createProductToCheckIntTest = function () {
    describe('GET /createProductToCheck', () => {
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

        it("should return 400 if Content-Type is not application/json", function () {
            console.warn("⚠️ Still TBA:");
            this.skip();
        });

        it("should return 400 if payload is empty", function () {
            console.warn("⚠️ Still TBA:");
            this.skip();
        });

        it("should return 400 if payload is missing any expected params", function () {
            console.warn("⚠️ Still TBA:");
            this.skip();
        });

        it("should return 405 if req method is not GET", function () {
            console.warn("⚠️ Still TBA:");
            this.skip();
        });

        it("should ignore keys in payload not allowed in productSchema", function () {
            console.warn("⚠️ Still TBA:");
            this.skip();
        });

        it("should return 500 if adding to Firestore fails ", function () {
            console.warn("⚠️ Still TBA:");
            this.skip();
        });
    });
};