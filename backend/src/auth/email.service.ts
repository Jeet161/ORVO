import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // port 587 uses STARTTLS
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false, // allow self-signed certs in dev
    },
  });

  async sendEmail(options: {
    to: string;
    subject: string;
    html: string;
    text?: string;
  }) {
    try {
      const info = await this.transporter.sendMail({
        from: process.env.EMAIL_FROM || 'ORVO <noreply@orvo.com>',
        ...options,
      });
      console.log('[EMAIL] Sent:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('[EMAIL] Error sending email:', error);
      return { success: false, error };
    }
  }

  getOtpTemplate(otp: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Jost:wght@400;600;700;800&display=swap');
        </style>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f4f4f8; font-family: 'Jost', sans-serif;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f4f4f8; padding: 40px 0;">
          <tr>
            <td align="center">
              <table width="600" border="0" cellspacing="0" cellpadding="0"
                style="background-color: #ffffff; border-radius: 24px; overflow: hidden;
                       box-shadow: 0 10px 40px rgba(0,0,0,0.08); border: 1px solid #e8e8f0;">
                <!-- Header -->
                <tr>
                  <td align="center"
                    style="background: linear-gradient(135deg, #6c63ff 0%, #00d4aa 100%); padding: 40px 0;">
                    <h1 style="color: #ffffff; font-family: 'Jost', sans-serif; font-size: 36px;
                               margin: 0; font-weight: 800; letter-spacing: 6px; text-transform: uppercase;">
                      ORVO
                    </h1>
                    <p style="color: rgba(255,255,255,0.7); font-size: 11px; margin-top: 8px;
                              letter-spacing: 2px; text-transform: uppercase;">
                      Your Trusted Marketplace
                    </p>
                  </td>
                </tr>
                <!-- Body -->
                <tr>
                  <td style="padding: 50px 40px;">
                    <h2 style="color: #1a1a2e; font-size: 24px; margin-bottom: 16px; font-weight: 700;">
                      Verify Your Account
                    </h2>
                    <p style="color: #666680; font-size: 16px; line-height: 26px; margin-bottom: 32px;">
                      Thank you for joining ORVO. To complete your registration, please use the verification code below.
                    </p>
                    <div style="background: linear-gradient(135deg, rgba(108,99,255,0.06) 0%, rgba(0,212,170,0.06) 100%);
                                border: 2px dashed #6c63ff; border-radius: 16px; padding: 32px;
                                text-align: center; margin-bottom: 32px;">
                      <span style="color: #6c63ff; font-size: 48px; font-weight: 800;
                                   letter-spacing: 14px; margin-left: 14px; font-family: 'Jost', sans-serif;">
                        ${otp}
                      </span>
                    </div>
                    <p style="color: #999ab0; font-size: 14px; text-align: center; margin-bottom: 0;">
                      This code will expire in <strong style="color: #1a1a2e;">10 minutes</strong>.
                    </p>
                  </td>
                </tr>
                <!-- Footer -->
                <tr>
                  <td style="background-color: #fafafc; padding: 28px 40px; border-top: 1px solid #f0f0f5;">
                    <p style="color: #aaaabc; font-size: 12px; line-height: 18px; margin: 0; text-align: center;">
                      If you didn't request this email, you can safely ignore it.
                    </p>
                    <div style="margin-top: 16px; text-align: center;">
                      <span style="background: linear-gradient(135deg, #6c63ff, #00d4aa);
                                   -webkit-background-clip: text; color: #6c63ff;
                                   font-size: 11px; font-weight: 700; letter-spacing: 1px;">
                        &copy; ${new Date().getFullYear()} ORVO MARKETPLACE
                      </span>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  }

  getResetPasswordTemplate(resetLink: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Jost:wght@400;600;700;800&display=swap');
        </style>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f4f4f8; font-family: 'Jost', sans-serif;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f4f4f8; padding: 40px 0;">
          <tr>
            <td align="center">
              <table width="600" border="0" cellspacing="0" cellpadding="0"
                style="background-color: #ffffff; border-radius: 24px; overflow: hidden;
                       box-shadow: 0 10px 40px rgba(0,0,0,0.08); border: 1px solid #e8e8f0;">
                <tr>
                  <td align="center"
                    style="background: linear-gradient(135deg, #6c63ff 0%, #00d4aa 100%); padding: 40px 0;">
                    <h1 style="color: #ffffff; font-family: 'Jost', sans-serif; font-size: 36px;
                               margin: 0; font-weight: 800; letter-spacing: 6px; text-transform: uppercase;">
                      ORVO
                    </h1>
                    <p style="color: rgba(255,255,255,0.7); font-size: 11px; margin-top: 8px;
                              letter-spacing: 2px; text-transform: uppercase;">
                      Your Trusted Marketplace
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 50px 40px;">
                    <h2 style="color: #1a1a2e; font-size: 24px; margin-bottom: 16px; font-weight: 700;">
                      Reset Your Password
                    </h2>
                    <p style="color: #666680; font-size: 16px; line-height: 26px; margin-bottom: 32px;">
                      We received a request to reset your ORVO password. Click the button below. This link expires in 1 hour.
                    </p>
                    <div style="text-align: center; margin-bottom: 32px;">
                      <a href="${resetLink}"
                        style="background: linear-gradient(135deg, #6c63ff, #00d4aa); color: #ffffff;
                               padding: 14px 32px; text-decoration: none; border-radius: 30px;
                               font-weight: 700; font-size: 14px; text-transform: uppercase;
                               letter-spacing: 1px; display: inline-block;">
                        Reset Password
                      </a>
                    </div>
                    <p style="color: #999ab0; font-size: 13px; text-align: center;">
                      If you didn't request this, you can safely ignore this email.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="background-color: #fafafc; padding: 28px 40px; border-top: 1px solid #f0f0f5;">
                    <p style="color: #aaaabc; font-size: 12px; line-height: 18px; margin: 0; text-align: center;">
                      &copy; ${new Date().getFullYear()} ORVO MARKETPLACE. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  }
}
