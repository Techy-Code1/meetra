import nodemailer from 'nodemailer';
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendOTPEmail = async (email, otp, name) => {
  await transporter.sendMail({
    from: '"Meetra || Connecting Ideas" <' + process.env.EMAIL_USER + '>',
    to:   email,
    subject: 'Verify your email — OTP',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2>Hi ${name},</h2>
        <p>Your email verification code is:</p>
        <h1 style="letter-spacing:10px;color:#378ADD">${otp}</h1>
        <p>This code expires in <strong>24 hours</strong>.</p>
        <p>If you did not create an account, ignore this email.</p>
      </div>
    `
  });
};

export default sendOTPEmail