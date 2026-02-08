import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private transporter: any;
  private fromEmail = process.env.EMAIL_FROM || 'noreply@coinkrazy.com';
  private isEnabled = !!process.env.SMTP_HOST;

  constructor() {
    // Configure email transporter
    if (process.env.SMTP_HOST) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    } else if (process.env.SENDGRID_API_KEY) {
      // SendGrid configuration
      const sgTransport = require('nodemailer-sendgrid-transport');
      this.transporter = nodemailer.createTransport(
        sgTransport({
          auth: {
            api_key: process.env.SENDGRID_API_KEY,
          },
        })
      );
    } else {
      console.warn('Email service not configured. Emails will not be sent.');
    }
  }

  /**
   * Send a generic email
   */
  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      if (!this.isEnabled && !this.transporter) {
        console.log(`[EMAIL] To: ${options.to}, Subject: ${options.subject}`);
        console.log(`[EMAIL] ${options.text || options.html}`);
        return true; // Pretend it was sent in development
      }

      await this.transporter.sendMail({
        from: this.fromEmail,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });

      console.log(`Email sent to ${options.to}: ${options.subject}`);
      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  }

  /**
   * Send email verification
   */
  async sendVerificationEmail(
    email: string,
    username: string,
    verificationToken: string
  ): Promise<boolean> {
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:8080'}/verify-email?token=${verificationToken}`;

    const html = `
      <html style="font-family: Arial, sans-serif; background-color: #f5f5f5;">
        <body style="margin: 0; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #ffd700 0%, #ffb347 100%); padding: 30px 20px; text-align: center;">
              <h1 style="margin: 0; color: #000; font-size: 32px;">CoinKrazy</h1>
              <p style="margin: 10px 0 0 0; color: #333; font-size: 14px;">Welcome to the Fun!</p>
            </div>

            <!-- Content -->
            <div style="padding: 30px 20px;">
              <h2 style="color: #333; margin-top: 0;">Welcome, ${username}!</h2>
              <p style="color: #666; line-height: 1.6;">
                Thanks for signing up to CoinKrazy! To complete your registration and start playing, please verify your email address.
              </p>

              <div style="margin: 30px 0;">
                <a href="${verificationUrl}" style="display: inline-block; background-color: #ffd700; color: #000; padding: 12px 30px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 16px;">
                  Verify Email Address
                </a>
              </div>

              <p style="color: #999; font-size: 12px;">
                Or copy and paste this link into your browser:<br>
                <code style="background-color: #f5f5f5; padding: 2px 4px;">${verificationUrl}</code>
              </p>

              <div style="background-color: #f9f9f9; border-left: 4px solid #ffd700; padding: 15px; margin: 30px 0; color: #666; font-size: 14px;">
                <p style="margin: 0;">
                  <strong>Welcome Bonus:</strong> Upon email verification, you'll receive 10 Gold Coins to start playing!
                </p>
              </div>

              <p style="color: #999; font-size: 12px; margin: 30px 0 0 0;">
                This link will expire in 24 hours. If you didn't create this account, please ignore this email.
              </p>
            </div>

            <!-- Footer -->
            <div style="background-color: #f5f5f5; border-top: 1px solid #ddd; padding: 20px; text-align: center; font-size: 12px; color: #999;">
              <p style="margin: 0;">CoinKrazy.com - Social Casino Platform</p>
              <p style="margin: 5px 0 0 0;">Must be 18+. Play Responsibly.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: 'Verify Your CoinKrazy Account',
      html,
      text: `Welcome to CoinKrazy! Click here to verify your email: ${verificationUrl}`,
    });
  }

  /**
   * Send payment confirmation
   */
  async sendPaymentConfirmation(
    email: string,
    username: string,
    packageName: string,
    amount: number,
    goldCoins: number,
    bonusCoins: number,
    orderId: string
  ): Promise<boolean> {
    const html = `
      <html style="font-family: Arial, sans-serif; background-color: #f5f5f5;">
        <body style="margin: 0; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #ffd700 0%, #ffb347 100%); padding: 30px 20px; text-align: center;">
              <h1 style="margin: 0; color: #000; font-size: 32px;">CoinKrazy</h1>
              <p style="margin: 10px 0 0 0; color: #333;">Payment Confirmation</p>
            </div>

            <!-- Content -->
            <div style="padding: 30px 20px;">
              <h2 style="color: #333; margin-top: 0;">Payment Received!</h2>
              <p style="color: #666; line-height: 1.6;">
                Thank you, ${username}! Your payment has been successfully processed.
              </p>

              <!-- Order Details -->
              <div style="background-color: #f9f9f9; border-left: 4px solid #4ade80; padding: 15px; margin: 20px 0;">
                <table style="width: 100%; color: #666; font-size: 14px;">
                  <tr>
                    <td style="padding: 8px 0;"><strong>Order ID:</strong></td>
                    <td style="padding: 8px 0; text-align: right;"><code>${orderId}</code></td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0;"><strong>Package:</strong></td>
                    <td style="padding: 8px 0; text-align: right;">${packageName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0;"><strong>Amount Paid:</strong></td>
                    <td style="padding: 8px 0; text-align: right; color: #4ade80; font-weight: bold;">$${amount.toFixed(2)}</td>
                  </tr>
                  <tr style="border-top: 1px solid #ddd;">
                    <td style="padding: 8px 0;"><strong>Gold Coins Received:</strong></td>
                    <td style="padding: 8px 0; text-align: right; color: #ffd700; font-weight: bold;">${goldCoins.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0;"><strong>Bonus Coins:</strong></td>
                    <td style="padding: 8px 0; text-align: right; color: #7c3aed; font-weight: bold;">+${bonusCoins.toLocaleString()}</td>
                  </tr>
                </table>
              </div>

              <div style="margin: 30px 0;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:8080'}/games" style="display: inline-block; background-color: #ffd700; color: #000; padding: 12px 30px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 16px;">
                  Start Playing Now
                </a>
              </div>

              <p style="color: #999; font-size: 12px; margin: 30px 0 0 0;">
                For questions about your purchase, please contact support@coinkrazy.com
              </p>
            </div>

            <!-- Footer -->
            <div style="background-color: #f5f5f5; border-top: 1px solid #ddd; padding: 20px; text-align: center; font-size: 12px; color: #999;">
              <p style="margin: 0;">CoinKrazy.com - Social Casino Platform</p>
              <p style="margin: 5px 0 0 0;">Responsible Gaming Resources: 1-800-522-4700</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: `CoinKrazy: Payment Confirmation - ${packageName}`,
      html,
      text: `Payment confirmed! You received ${goldCoins} Gold Coins + ${bonusCoins} Bonus Coins for $${amount.toFixed(2)}`,
    });
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(
    email: string,
    username: string
  ): Promise<boolean> {
    const html = `
      <html style="font-family: Arial, sans-serif; background-color: #f5f5f5;">
        <body style="margin: 0; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #ffd700 0%, #ffb347 100%); padding: 30px 20px; text-align: center;">
              <h1 style="margin: 0; color: #000; font-size: 32px;">🎉 Welcome, ${username}! 🎉</h1>
            </div>

            <!-- Content -->
            <div style="padding: 30px 20px;">
              <p style="color: #666; line-height: 1.6;">
                Your email has been verified! You're all set to start playing and winning at CoinKrazy.
              </p>

              <div style="background-color: #f9f9f9; border-left: 4px solid #ffd700; padding: 15px; margin: 20px 0;">
                <h3 style="margin: 0 0 10px 0; color: #333;">Your Welcome Bonus:</h3>
                <p style="margin: 0; color: #666;">
                  <strong>10 Gold Coins</strong> - Ready to play!<br>
                  <strong>10 Sweeps Coins</strong> - Win real prizes!
                </p>
              </div>

              <h3 style="color: #333;">Quick Start Guide:</h3>
              <ol style="color: #666; line-height: 1.8;">
                <li>Browse our <strong>12+ slot games</strong></li>
                <li>Start with your welcome bonus coins</li>
                <li>Spin and try to win big multipliers!</li>
                <li>Purchase more coins to keep playing</li>
              </ol>

              <div style="background-color: #f0f8ff; border-left: 4px solid #7c3aed; padding: 15px; margin: 20px 0;">
                <p style="margin: 0; color: #333; font-size: 14px;">
                  <strong>Playing Responsibly:</strong> Set your own limits in account settings and use our responsible gaming tools to stay in control.
                </p>
              </div>

              <div style="margin: 30px 0;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:8080'}/games" style="display: inline-block; background-color: #4ade80; color: #fff; padding: 12px 30px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 16px;">
                  Play Now →
                </a>
              </div>
            </div>

            <!-- Footer -->
            <div style="background-color: #f5f5f5; border-top: 1px solid #ddd; padding: 20px; text-align: center; font-size: 12px; color: #999;">
              <p style="margin: 0;">CoinKrazy.com - Social Casino Platform</p>
              <p style="margin: 5px 0 0 0;">Questions? Email support@coinkrazy.com</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: `Welcome to CoinKrazy, ${username}! 🎰`,
      html,
      text: `Welcome to CoinKrazy! You have 10 Gold Coins and 10 Sweeps Coins waiting. Start playing now!`,
    });
  }

  /**
   * Send promotional email
   */
  async sendPromoEmail(
    email: string,
    username: string,
    promoTitle: string,
    promoDescription: string,
    bonusDetails: string
  ): Promise<boolean> {
    const html = `
      <html style="font-family: Arial, sans-serif; background-color: #f5f5f5;">
        <body style="margin: 0; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #ffd700 0%, #ffb347 100%); padding: 30px 20px; text-align: center;">
              <h1 style="margin: 0; color: #000; font-size: 28px;">✨ ${promoTitle} ✨</h1>
            </div>

            <!-- Content -->
            <div style="padding: 30px 20px;">
              <h2 style="color: #333; margin-top: 0;">Hi ${username},</h2>
              <p style="color: #666; line-height: 1.6;">
                ${promoDescription}
              </p>

              <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
                <h3 style="margin: 0 0 10px 0; color: #333;">🎁 Your Bonus:</h3>
                <p style="margin: 0; color: #666; line-height: 1.6;">
                  ${bonusDetails}
                </p>
              </div>

              <div style="margin: 30px 0;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:8080'}/games" style="display: inline-block; background-color: #ffd700; color: #000; padding: 12px 30px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 16px;">
                  Claim Your Bonus
                </a>
              </div>
            </div>

            <!-- Footer -->
            <div style="background-color: #f5f5f5; border-top: 1px solid #ddd; padding: 20px; text-align: center; font-size: 12px; color: #999;">
              <p style="margin: 0;">CoinKrazy.com - Social Casino Platform</p>
              <p style="margin: 5px 0 0 0;">Unsubscribe from promotions in your account settings</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: promoTitle,
      html,
      text: promoDescription,
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(
    email: string,
    username: string,
    resetToken: string
  ): Promise<boolean> {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:8080'}/reset-password?token=${resetToken}`;

    const html = `
      <html style="font-family: Arial, sans-serif; background-color: #f5f5f5;">
        <body style="margin: 0; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #ffd700 0%, #ffb347 100%); padding: 30px 20px; text-align: center;">
              <h1 style="margin: 0; color: #000;">CoinKrazy</h1>
              <p style="margin: 10px 0 0 0; color: #333;">Password Reset</p>
            </div>

            <!-- Content -->
            <div style="padding: 30px 20px;">
              <h2 style="color: #333; margin-top: 0;">Reset Your Password</h2>
              <p style="color: #666; line-height: 1.6;">
                Hi ${username}, we received a request to reset your password. Click the button below to set a new password.
              </p>

              <div style="margin: 30px 0;">
                <a href="${resetUrl}" style="display: inline-block; background-color: #ff6b6b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 16px;">
                  Reset Password
                </a>
              </div>

              <p style="color: #999; font-size: 12px;">
                Link expires in 1 hour. If you didn't request this, please ignore this email.
              </p>
            </div>

            <!-- Footer -->
            <div style="background-color: #f5f5f5; border-top: 1px solid #ddd; padding: 20px; text-align: center; font-size: 12px; color: #999;">
              <p style="margin: 0;">CoinKrazy.com - Social Casino Platform</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: 'CoinKrazy: Password Reset Request',
      html,
      text: `Click here to reset your password: ${resetUrl}`,
    });
  }
}

export const emailService = new EmailService();
export default emailService;
