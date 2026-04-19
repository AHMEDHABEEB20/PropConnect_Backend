const nodemailer = require('nodemailer');

function createTransport() {
  const port = Number(process.env.EMAIL_PORT) || 587;
  const secure =
    String(process.env.EMAIL_SECURE).toLowerCase() === 'true' || port === 465;

  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port,
    secure,
    auth:
      process.env.EMAIL_USER && process.env.EMAIL_PASS
        ? {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          }
        : undefined,
  });
}

async function sendEmail({ to, subject, text, html }) {
  const from = process.env.EMAIL_FROM || process.env.EMAIL_USER;
  if (!from) {
    throw new Error('EMAIL_FROM or EMAIL_USER must be set for outgoing mail');
  }

  const transporter = createTransport();
  await transporter.sendMail({
    from,
    to,
    subject,
    text,
    html: html || text,
  });
}

module.exports = { sendEmail };
