import prisma from '../lib/prisma';

const logAuth = async (user_id, action, req, status = 'success') => {
  try {
    await prisma.authenticationLog.create({
      data: {
        user_id,
        action,   // 'REGISTER' | 'LOGIN' | 'LOGOUT' | 'OTP_VERIFIED' | 'FAILED'
        ip_address: req.ip || req.headers['x-forwarded-for'],
        user_agent: req.headers['user-agent'],
        status
      }
    });
  } catch (e) {
    console.error('Auth log failed:', e.message);
  }
};

export default logAuth