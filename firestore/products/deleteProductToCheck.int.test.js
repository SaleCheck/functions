const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
const { getStorage } = require("firebase-admin/storage");
const { expect } = require('chai');
const request = require('supertest');
const express = require('express');
const firebaseConfig = require('../../../firebase.json');

if (!process.env.FIRESTORE_EMULATOR_HOST) throw new Error('FIRESTORE_EMULATOR_HOST is not set');
if (firebaseConfig.emulators && firebaseConfig.emulators.storage) {
    process.env.FIREBASE_STORAGE_EMULATOR_HOST = `localhost:${firebaseConfig.emulators.storage.port}`;
}
if (!admin.apps.length) {
    admin.initializeApp({
        projectId: process.env.PROJECT_ID,
        storageBucket: process.env.STORAGE_BUCKET
    });
}
const { deleteProductToCheck } = require('./deleteProductToCheck');

const db = getFirestore();
const storage = getStorage();
// db.settings({ host: process.env.FIRESTORE_EMULATOR_HOST, ssl: false });

const app = express();
app.use(express.json());
app.use('/deleteProductToCheck', deleteProductToCheck);

exports.deleteProductToCheckIntTest = function () {
    describe('DELETE /deleteProductToCheck', () => {
        let testProductId;
        let storageFilePath;
        const testProductData = {
            "productName": "productForDeletion",
            "expectedPrice": 29.99,
            "expectedPriceCurrency": "USD",
            "url": "http: //example.com/product",
            "cssSelector": ".product-price",
            "user": "YlGEGBCRfBV6o3TIUrTqvcdMxMi2"
        };

        beforeEach(async () => {
            testProductId = db.collection("productsToCheck").doc().id;
            await db.collection("productsToCheck").doc(testProductId).set(testProductData);

            const bucket = storage.bucket();
            storageFilePath = `productImages/${testProductId}/dummy.txt`;
            const buffer = Buffer.from("This is a test file for deletion.");
            const file = bucket.file(storageFilePath);
            await file.save(buffer, { contentType: 'text/plain', });
        });

        afterEach(async () => {
            if (testProductId) await db.collection("productsToCheck").doc(testProductId).delete();
            if (storageFilePath) {
                const bucket = storage.bucket();
                const file = bucket.file(storageFilePath);
                const [exists] = await file.exists();
                if (exists) await file.delete();
            }
        });


        it("should handle OPTIONS preflight request with appropriate CORS headers", async () => {
            const res = await request(app)
                .options('/deleteProductToCheck')
                .set('Origin', 'http://example.com');

            expect(res.status).to.be.oneOf([200, 204]);
            expect(res.headers).to.have.property('access-control-allow-origin');
            expect(res.headers['access-control-allow-origin']).to.equal('http://example.com');
        });

        it('should return 200 and delete from collection in Firestore', async () => {
            const deletePayload = { "data": { "id": testProductId } };
            const res = await request(app)
                .delete('/deleteProductToCheck')
                .set('Content-Type', 'application/json')
                .send(deletePayload);

            expect(res.status).to.equal(200);

            const doc = await db.collection('productsToCheck').doc(testProductId).get();
            expect(doc.exists).to.be.false;
        });

        it('should return 200 and delete associated files from Storage', async () => {
            const deletePayload = { "data": { "id": testProductId } };
            const res = await request(app)
                .delete('/deleteProductToCheck')
                .set('Content-Type', 'application/json')
                .send(deletePayload);

            expect(res.status).to.equal(200);

            const [exists] = await storage.bucket().file(storageFilePath).exists();
            expect(exists).to.be.false;
        });

        it("should return 400 if param id param is missing from payload", async () => {
            const deletePayload = { "data": { "product": testProductId } };
            const res = await request(app)
                .delete('/deleteProductToCheck')
                .set('Content-Type', 'application/json')
                .send(deletePayload);

            expect(res.status).to.equal(400);
        });

        it("should return 400 if content-type is not application/json", async () => {
            const deletePayload = { "data": { "id": testProductId } };
            const res = await request(app)
                .delete('/deleteProductToCheck')
                .set('Content-Type', 'application/x-www-form-urlencoded')
                .send(deletePayload);

            expect(res.status).to.equal(400);
        });

        it("should return 404 if product does not exist", function () {
            console.warn("⚠️ Still TBA.");
            this.skip();
        });

        it("should return 405 if req method is not DELETE", function () {
            console.warn("⚠️ Still TBA.");
            this.skip();
        });

        it("should return 500 if serverside error", function () {
            console.warn("⚠️ Still TBA:");
            this.skip();
        });
    });
}
