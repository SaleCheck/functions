const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
const { expect } = require('chai');
const request = require('supertest');
const express = require('express');

if (!process.env.FIRESTORE_EMULATOR_HOST) throw new Error('FIRESTORE_EMULATOR_HOST is not set');
if (!admin.apps.length) admin.initializeApp({ projectId: process.env.PROJECT_ID });
const { getProductToCheck } = require('./getProductToCheck');

const db = getFirestore();
// db.settings({ host: process.env.FIRESTORE_EMULATOR_HOST, ssl: false });

const app = express();
app.use('/getProductToCheck', getProductToCheck);

exports.getProductToCheckIntTest = function () {
  describe('GET /getProductToCheck', () => {
    const testProductId = 'test-product-id';
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

    before(async () => {
      await db.collection("productsToCheck").doc(testProductId).set(testProductData);
    });

    after(async () => {
      await db.collection("productsToCheck").doc(testProductId).delete();
    });

    it('should return 200 and the product snapshot data if it exists', async () => {
      const res = await request(app)
        .get('/getProductToCheck')
        .query({ id: testProductId })

      expect(res.status).to.equal(200);
      expect(res.body).to.deep.equal(testProductData)
    });

    it("should return 400 if param id param is missing from payload", function () {
      console.warn("⚠️ Still TBA:");
      this.skip();
    });

    it("should return 404 if product does not exist", function () {
      console.warn("⚠️ Still TBA.");
      this.skip();
    });

    it("should return 405 if req method is not GET", function () {
      console.warn("⚠️ Still TBA.");
      this.skip();
    });
  });
};