const { getFirestore } = require('firebase-admin/firestore');
const { getStorage } = require("firebase-admin/storage");
const { expect } = require('chai');
const request = require('supertest');
const express = require('express');
const sinon = require('sinon');
const { deleteProductToCheck } = require('./deleteProductToCheck');

const db = getFirestore();
const storage = getStorage();

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
            const res = await request(app)
                .delete('/deleteProductToCheck')
                .set('Content-Type', 'application/json')
                .send({ "data": { "id": testProductId } });

            expect(res.status).to.equal(200);

            const doc = await db.collection('productsToCheck').doc(testProductId).get();
            expect(doc.exists).to.be.false;
        });

        it('should return 200 and delete associated files from Storage', async () => {
            const res = await request(app)
                .delete('/deleteProductToCheck')
                .set('Content-Type', 'application/json')
                .send({ "data": { "id": testProductId } });

            expect(res.status).to.equal(200);

            const [exists] = await storage.bucket().file(storageFilePath).exists();
            expect(exists).to.be.false;
        });

        it("should return 400 if id param is missing from payload", async () => {
            const res = await request(app)
                .delete('/deleteProductToCheck')
                .set('Content-Type', 'application/json')
                .send({ "data": { "product": testProductId } });

            expect(res.status).to.equal(400);
        });

        it("should return 400 if content-type is not application/json", async () => {
            const res = await request(app)
                .delete('/deleteProductToCheck')
                .set('Content-Type', 'application/x-www-form-urlencoded')
                .send({ "data": { "id": testProductId } });

            expect(res.status).to.equal(400);
        });

        it("should return 404 if product does not exist", async () => {
            const res = await request(app)
                .delete('/deleteProductToCheck')
                .set('Content-Type', 'application/json')
                .send({ "data": { "id": 'nonexistent-id-123456' } });

            expect(res.status).to.equal(404);
        });

        it("should return 405 if req method is not DELETE", async () => {
            const res = await request(app)
                .post('/deleteProductToCheck')
                .set('Content-Type', 'application/json')
                .send({ "data": { "id": testProductId } });

            expect(res.status).to.equal(405);
        });

        it("should return 500 if serverside fails", async () => {
            const docStub = { get: sinon.stub().rejects(new Error('Simulated server error')) };
            const collectionStub = sinon.stub(db, 'collection').returns({
                doc: sinon.stub().returns(docStub),
            });
            const consoleErrorStub = sinon.stub(console, 'error');

            try {
                const res = await request(app)
                    .delete('/deleteProductToCheck')
                    .set('Content-Type', 'application/json')
                    .send({ "data": { "id": testProductId } });

                expect(res.status).to.equal(500);
                expect(res.body).to.have.property('status', 'Internal Server Error');
                expect(res.body).to.have.property('error');
            } finally {
                collectionStub.restore();
                consoleErrorStub.restore();
            }
        });
    });
}
