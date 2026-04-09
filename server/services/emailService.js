const nodemailer = require('nodemailer');

// Create transporter (uses Ethereal for development)
let transporter;

const initTransporter = async () => {
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  } else {
    // Create test account using Ethereal
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
    console.log('📧 Using Ethereal test email account');
  }
};

const getBaseTemplate = (content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { 
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
      margin: 0; padding: 0; 
      background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%); 
    }
    .container { 
      max-width: 600px; margin: 0 auto; 
      background: #1e293b; 
      border-radius: 16px; 
      overflow: hidden; 
      margin-top: 20px; 
      margin-bottom: 20px;
      border: 1px solid rgba(99, 102, 241, 0.2);
    }
    .header { 
      background: linear-gradient(135deg, #6366f1, #8b5cf6); 
      padding: 30px; text-align: center; 
    }
    .header h1 { 
      color: white; margin: 0; font-size: 28px; 
      font-weight: 700; letter-spacing: -0.5px; 
    }
    .header p { color: rgba(255,255,255,0.8); margin: 5px 0 0; }
    .content { padding: 30px; color: #e2e8f0; line-height: 1.6; }
    .content h2 { color: #a5b4fc; margin-top: 0; }
    .btn { 
      display: inline-block; padding: 14px 32px; 
      background: linear-gradient(135deg, #6366f1, #8b5cf6); 
      color: white !important; text-decoration: none; 
      border-radius: 12px; font-weight: 600; 
      margin: 20px 0; font-size: 16px;
    }
    .footer { 
      text-align: center; padding: 20px; 
      color: #64748b; font-size: 12px; 
      border-top: 1px solid rgba(99, 102, 241, 0.1);
    }
    .amount { 
      font-size: 32px; font-weight: 700; 
      color: #10b981; text-align: center; 
      padding: 15px; 
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>💸 SplitSmart</h1>
      <p>Smart Expense Splitting</p>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} SplitSmart. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`;

const sendEmail = async ({ to, subject, html }) => {
  try {
    if (!transporter) await initTransporter();
    
    const info = await transporter.sendMail({
      from: '"SplitSmart" <noreply@splitsmart.com>',
      to,
      subject,
      html: getBaseTemplate(html)
    });

    // Log preview URL for Ethereal
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log('📧 Preview URL:', previewUrl);
    }
    return info;
  } catch (error) {
    console.error('Email send error:', error.message);
    // Don't throw in dev - email failure shouldn't block operations
  }
};

const sendVerificationEmail = async (user, token) => {
  const verifyUrl = `${process.env.CLIENT_URL}/verify-email?token=${token}`;
  return sendEmail({
    to: user.email,
    subject: 'Verify Your SplitSmart Account',
    html: `
      <h2>Welcome, ${user.name}! 🎉</h2>
      <p>Thanks for signing up for SplitSmart. Please verify your email address to get started.</p>
      <div style="text-align: center;">
        <a href="${verifyUrl}" class="btn">Verify Email</a>
      </div>
      <p style="color: #94a3b8; font-size: 14px;">If you didn't create an account, you can safely ignore this email.</p>
    `
  });
};

const sendPasswordResetEmail = async (user, token) => {
  const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${token}`;
  return sendEmail({
    to: user.email,
    subject: 'Reset Your SplitSmart Password',
    html: `
      <h2>Password Reset Request 🔐</h2>
      <p>Hi ${user.name}, we received a request to reset your password. Click the button below to create a new password.</p>
      <div style="text-align: center;">
        <a href="${resetUrl}" class="btn">Reset Password</a>
      </div>
      <p style="color: #94a3b8; font-size: 14px;">This link expires in 1 hour. If you didn't request this, ignore this email.</p>
    `
  });
};

const sendSettlementNotification = async (from, to, amount, groupName) => {
  return sendEmail({
    to: to.email,
    subject: `Settlement Received - ${groupName}`,
    html: `
      <h2>Settlement Notification 💳</h2>
      <p>${from.name} has settled a payment in <strong>${groupName}</strong>.</p>
      <div class="amount">₹${amount.toFixed(2)}</div>
      <p style="text-align: center; color: #94a3b8;">Payment has been marked as completed</p>
    `
  });
};

module.exports = {
  initTransporter,
  sendEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendSettlementNotification
};
