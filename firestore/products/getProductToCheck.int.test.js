const { getFirestore } = require('firebase-admin/firestore');
const { expect } = require('chai');
const request = require('supertest');
const express = require('express');
const { getProductToCheck } = require('./getProductToCheck');

const db = getFirestore();


const app = express();
app.use('/getProductToCheck', getProductToCheck);

exports.getProductToCheckIntTest = function () {
  describe('GET /getProductToCheck', () => {
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

    before(async () => {
      testProductId = db.collection("productsToCheck").doc().id;
      await db.collection("productsToCheck").doc(testProductId).set(testProductData);
    });

    after(async () => {
      if (testProductId) await db.collection("productsToCheck").doc(testProductId).delete();
    });

    it("should handle OPTIONS preflight request with appropriate CORS headers", async () => {
      const res = await request(app)
        .options('/getProductToCheck')     
        .set('Origin', 'http://example.com');

      expect(res.status).to.be.oneOf([200, 204]);
      expect(res.headers).to.have.property('access-control-allow-origin');
      expect(res.headers['access-control-allow-origin']).to.equal('http://example.com');
    });

    it('should return 200 and the product snapshot data if it exists', async () => {
      const res = await request(app)
        .get('/getProductToCheck')
        .query({ id: testProductId })

      expect(res.status).to.equal(200);
      expect(res.body).to.deep.equal(testProductData)
    });

    it("should return 400 if id param is missing from payload", async () => {
      const res = await request(app)
        .get('/getProductToCheck')
        .query({ product: testProductId })

      expect(res.status).to.equal(400);
    });

    it("should return 404 if product does not exist", async () => {
      const res = await request(app)
        .get('/getProductToCheck')
        .query({ id: 'nonexistent-id-123456' })

      expect(res.status).to.equal(404);
    });

    it("should return 405 if req method is not GET", async () => {
      const res = await request(app)
        .post('/getProductToCheck')
        .query({ id: testProductId })

      expect(res.status).to.equal(405);
    });

    it("should return 500 if serverside fails", function () {
      console.warn("⚠️ Still TBA:");
      this.skip();
    });
  });
};