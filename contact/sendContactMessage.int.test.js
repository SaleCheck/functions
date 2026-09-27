const { expect } = require('chai');
const request = require('supertest');
const express = require('express');
const sinon = require('sinon');
const emailService = require('../utils/emailService');
const { sendContactMessage } = require('./sendContactMessage');

const app = express();
app.use(express.json());
app.use('/sendContactMessage', sendContactMessage);

exports.sendContactMessageIntTest = () => {
  describe('POST /sendContactMessage', () => {
    let testContactData;
    let sendEmailStub;

    beforeEach(async () => {
      sendEmailStub = sinon.stub(emailService, 'sendEmail').resolves();

      testContactData = {
        data: {
          name: 'Integration Test User',
          email: 'integration.test.user@mailinator.com',
          message: 'This is a test message from the integration suite.',
        },
      };
    });

    afterEach(() => {
      sendEmailStub.restore();
    });

    it('should handle OPTIONS preflight request with appropriate CORS headers', async () => {
      const res = await request(app)
        .options('/sendContactMessage')
        .set('Origin', 'http://example.com');

      expect(res.status).to.be.oneOf([200, 204]);
      expect(res.headers).to.have.property('access-control-allow-origin');
      expect(res.headers['access-control-allow-origin']).to.equal(
        'http://example.com'
      );
    });

    it('should return 200 and send email with valid mandatory params', async () => {
      const res = await request(app)
        .post('/sendContactMessage')
        .set('Content-Type', 'application/json')
        .send(testContactData);

      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('status', 'Success');
    });

    it('should return 400 if payload missing mandatory param name', async () => {
      delete testContactData.data.name;

      const res = await request(app)
        .post('/sendContactMessage')
        .set('Content-Type', 'application/json')
        .send(testContactData);

      expect(res.status).to.equal(400);
    });

    it('should return 400 if payload missing mandatory param email', async () => {
      delete testContactData.data.email;

      const res = await request(app)
        .post('/sendContactMessage')
        .set('Content-Type', 'application/json')
        .send(testContactData);

      expect(res.status).to.equal(400);
    });

    it('should return 400 if payload missing mandatory param message', async () => {
      delete testContactData.data.message;

      const res = await request(app)
        .post('/sendContactMessage')
        .set('Content-Type', 'application/json')
        .send(testContactData);

      expect(res.status).to.equal(400);
    });

    it('should return 400 if payload missing all mandatory params', async () => {
      testContactData.data = {};

      const res = await request(app)
        .post('/sendContactMessage')
        .set('Content-Type', 'application/json')
        .send(testContactData);

      expect(res.status).to.equal(400);
    });

    it('should return 400 if content-type is not application/json', async () => {
      const res = await request(app)
        .post('/sendContactMessage')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send(testContactData);

      expect(res.status).to.equal(400);
    });

    it('should return 405 if req method is not POST', async () => {
      const res = await request(app)
        .patch('/sendContactMessage')
        .set('Content-Type', 'application/json')
        .send(testContactData);

      expect(res.status).to.equal(405);
    });

    it('should return 500 if sendEmail fails', async () => {
      sendEmailStub.rejects(new Error('Simulated email send failure'));
      const consoleErrorStub = sinon.stub(console, 'error');

      try {
        const res = await request(app)
          .post('/sendContactMessage')
          .set('Content-Type', 'application/json')
          .send(testContactData);

        expect(res.status).to.equal(500);
        expect(res.body).to.have.property('status', 'Internal Server Error');
        expect(res.body).to.have.property('error');
      } finally {
        consoleErrorStub.restore();
      }
    });
  });
};
