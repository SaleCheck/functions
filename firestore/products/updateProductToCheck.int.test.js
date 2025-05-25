const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
const { expect } = require('chai');
const request = require('supertest');
const express = require('express');
const ALLOWED_FIELDS = require("./config/productsFirestoreStructureConfig.json");

if (!process.env.FIRESTORE_EMULATOR_HOST) throw new Error('FIRESTORE_EMULATOR_HOST is not set');
if (!admin.apps.length) admin.initializeApp({ projectId: process.env.PROJECT_ID });
const { updateProductToCheck } = require('./updateProductToCheck');

const db = getFirestore();
// db.settings({ host: process.env.FIRESTORE_EMULATOR_HOST, ssl: false });

const app = express();
app.use(express.json());
app.use('/updateProductToCheck', updateProductToCheck);

exports.updateProductToCheckIntTest = function () {
    describe('PATCH /updateProductToCheck', () => {
        let testProductId;
        const testProductData = {
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
        };
        const updTestProductData = {
            "data": {
                "id": testProductId,
                "updateData": {
                    "productName": "DifferentExampleProduct",
                    "expectedPrice": 99.99,
                    "expectedPriceCurrency": "INR",
                    "url": "http://bipbop.com/bip",
                    "emailNotification": [
                        "harry.potter@hogwarts.com",
                        "ron.weasley@hogwarts.com",
                        "hermione.granger@hogwarts.com"
                    ],
                    "cssSelector": ".hogwarts-library",
                    "user": "YlGEGBCRfBV6o3TIUrTqvcdMxMi2"
                }

            }
        };

        before(async () => {
            testProductId = db.collection("productsToCheck").doc().id;
            updTestProductData.data.id = testProductId;
            await db.collection("productsToCheck").doc(testProductId).set(testProductData);
        });

        after(async () => {
            if (testProductId) await db.collection("productsToCheck").doc(testProductId).delete();
        });

        it("should handle OPTIONS preflight request with appropriate CORS headers", async () => {
            const res = await request(app)
                .options('/updateProductToCheck')
                .set('Origin', 'http://example.com');

            expect(res.status).to.be.oneOf([200, 204]);
            expect(res.headers).to.have.property('access-control-allow-origin');
            expect(res.headers['access-control-allow-origin']).to.equal('http://example.com');
        });

        it("should return 200 if field is updated successfully", async () => {
            const res = await request(app)
                .patch('/updateProductToCheck')
                .set('Content-Type', 'application/json')
                .send(updTestProductData);

            expect(res.status).to.equal(200);
            expect(res.body).to.have.property('success', true);

            const updatedDocSnap = await db.collection('productsToCheck').doc(testProductId).get();
            const updatedDocData = updatedDocSnap.data();

            for (const key of Object.keys(updTestProductData.data.updateData)) {
                expect(updatedDocData[key]).to.deep.equal(updTestProductData.data.updateData[key]);
            };

            expect(updatedDocData).to.have.property('lastUpdated');
            expect(updatedDocData.lastUpdated).to.be.an.instanceOf(admin.firestore.Timestamp);
        });

        it("should skip fields not in ALLOWED_FIELDS", async () => {
            const updTestProductDataWithInvalid = JSON.parse(JSON.stringify(updTestProductData));

            updTestProductDataWithInvalid.data.updateData.unknownField1 = "ShouldNotBeSaved";
            updTestProductDataWithInvalid.data.updateData.anotherInvalidField = "12345";

            const res = await request(app)
                .patch('/updateProductToCheck')
                .set('Content-Type', 'application/json')
                .send(updTestProductDataWithInvalid);

            expect(res.status).to.equal(200);
            expect(res.body).to.have.property('success', true);

            const updatedDocSnap = await db.collection('productsToCheck').doc(testProductId).get();
            const updatedDocData = updatedDocSnap.data();


            for (const key of Object.keys(updTestProductDataWithInvalid.data.updateData)) {
                if (ALLOWED_FIELDS.includes(key)) {
                    expect(updatedDocData[key]).to.deep.equal(updTestProductDataWithInvalid.data.updateData[key]);

                } else if (!(ALLOWED_FIELDS.includes(key))) {
                    expect(updatedDocData).to.not.have.property(key);

                } else {
                    throw new Error(`Unexpected key ${key} encountered while validating update data`);
                }
            };

            expect(updatedDocData).to.have.property('lastUpdated');
            expect(updatedDocData.lastUpdated).to.be.an.instanceOf(admin.firestore.Timestamp);
        });

        it("should return 400 if param id param is missing from payload", function () {
            console.warn("⚠️ Still TBA:");
            this.skip();
        });

        it("should return 404 if product does not exist", function () {
            console.warn("⚠️ Still TBA.");
            this.skip();
        });

        it("should return 405 if req method is not PATCH", function () {
            console.warn("⚠️ Still TBA.");
            this.skip();
        });

        it("should return 500 if fetching from Firestore fails ", function () {
            console.warn("⚠️ Still TBA:");
            this.skip();
        });
    });
};