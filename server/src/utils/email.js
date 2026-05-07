// utils/email.js
export const sendPasswordResetOTPEmail = async (email, otp, firstName) => {
  // use nodemailer / resend / sendgrid etc.
  await transporter.sendMail({
    to: email,
    subject: "Password Reset OTP",
    html: `<p>Hi ${firstName},</p>
           <p>Your OTP to reset your password is: <strong>${otp}</strong></p>
           <p>Valid for 15 minutes.</p>`
  });
};