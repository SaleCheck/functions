const { onRequest } = require('firebase-functions/v2/https');
const cors = require('cors')({ origin: true });
const emailService = require('../utils/emailService');

exports.sendContactMessage = onRequest(
  { timeoutSeconds: 300, memory: '1GiB' },
  async (req, res) => {
    cors(req, res, async () => {
      if (req.method !== 'POST')
        return res.status(405).send({
          success: false,
          error: 'Method Not Allowed. Only POST requests are allowed.',
        });

      if (req.get('Content-Type') !== 'application/json')
        return res.status(400).send({
          success: false,
          error: 'Content-Type must be application/json.',
        });

      const { name, email, message } = req.body.data;
      if (!name || !email || !message)
        return res.status(400).send({
          error: 'Bad Request: name, email and message are required',
        });

      try {
        await emailService.sendEmail({
          from: process.env.EMAILUSER,
          to: process.env.EMAILUSER,
          replyTo: email,
          subject: `New contact message from ${name}`,
          text: `From: ${name} <${email}>\n\n${message}`,
        });

        return res.status(200).send({ status: 'Success' });
      } catch (error) {
        console.error('Error sending contact message: ', error);
        return res
          .status(500)
          .send({ status: 'Internal Server Error', error: error });
      }
    });
  }
);
