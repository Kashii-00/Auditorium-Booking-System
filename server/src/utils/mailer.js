const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail", // or use SMTP provider
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

const sendBasicEmail = async (to, subject, message) => {
  return transporter.sendMail({
    from: process.env.MAIL_USER,
    to,
    subject,
    text: message,
  });
};

module.exports = sendBasicEmail;
