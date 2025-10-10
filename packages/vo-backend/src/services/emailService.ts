import { Resend } from 'resend';

export interface EmailVerificationData {
  email: string;
  verificationToken: string;
  userName?: string;
}

export class EmailService {
  private static instance: EmailService;
  private fromEmail: string;
  private resendClient: Resend | null = null;

  constructor() {
    this.fromEmail = process.env.FROM_EMAIL || 'noreply@askakasha.com';
  }

  static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  private getResend(): Resend {
    if (this.resendClient) return this.resendClient;
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY is missing. Set it in environment before sending emails.');
    }
    this.resendClient = new Resend(apiKey);
    return this.resendClient;
  }

  async sendVerificationEmail(data: EmailVerificationData): Promise<void> {
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin/verify-email?token=${data.verificationToken}`;
    // Minimal runtime diagnostics to validate env wiring in production
    const maskedKey = process.env.RESEND_API_KEY ? `${process.env.RESEND_API_KEY.slice(0, 6)}***` : 'missing';
    console.log(
      '[EmailService] Preparing verification email',
      {
        fromEmail: this.fromEmail,
        resendKey: maskedKey,
        verificationUrl
      }
    );
    
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your Email - Ask Akasha</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #4f46e5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to Ask Akasha!</h1>
            </div>
            <div class="content">
              <h2>Verify Your Email Address</h2>
              <p>Hi${data.userName ? ` ${data.userName}` : ''},</p>
              <p>Thank you for creating an admin account with Ask Akasha. To complete your registration and start managing your organization's knowledge base, please verify your email address.</p>
              
              <div style="text-align: center;">
                <a href="${verificationUrl}" class="button">Verify Email Address</a>
              </div>
              
              <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
              <p style="word-break: break-all; background: #e5e7eb; padding: 10px; border-radius: 4px; font-family: monospace;">${verificationUrl}</p>
              
              <p><strong>Important:</strong> This verification link will expire in 24 hours for security reasons.</p>
              
              <p>If you didn't create an account with Ask Akasha, please ignore this email.</p>
            </div>
            <div class="footer">
              <p>© 2024 Ask Akasha. All rights reserved.</p>
              <p>This email was sent to ${data.email}</p>
            </div>
          </div>
        </body>
      </html>
    `;

    try {
      await this.getResend().emails.send({
        from: this.fromEmail,
        to: [data.email],
        subject: 'Verify Your Email - Ask Akasha Admin Account',
        html: emailHtml,
      });
      
      console.log(`✅ Verification email sent to ${data.email}`);
    } catch (error) {
      console.error('❌ Failed to send verification email:', error);
      throw new Error('Failed to send verification email');
    }
  }

  async sendWelcomeEmail(email: string, userName?: string): Promise<void> {
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to Ask Akasha!</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #4f46e5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to Ask Akasha!</h1>
            </div>
            <div class="content">
              <h2>Your Account is Verified! 🎉</h2>
              <p>Hi${userName ? ` ${userName}` : ''},</p>
              <p>Congratulations! Your admin account has been successfully verified and is ready to use.</p>
              
              <h3>What's Next?</h3>
              <ul>
                <li>Create your first organization</li>
                <li>Upload documents to build your knowledge base</li>
                <li>Invite team members to collaborate</li>
                <li>Start asking questions with AI-powered search</li>
              </ul>
              
              <div style="text-align: center;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin/login" class="button">Access Your Dashboard</a>
              </div>
              
              <p>If you have any questions or need help getting started, don't hesitate to reach out to our support team.</p>
            </div>
            <div class="footer">
              <p>© 2024 Ask Akasha. All rights reserved.</p>
              <p>This email was sent to ${email}</p>
            </div>
          </div>
        </body>
      </html>
    `;

    try {
      await this.getResend().emails.send({
        from: this.fromEmail,
        to: [email],
        subject: 'Welcome to Ask Akasha - Your Account is Verified!',
        html: emailHtml,
      });
      
      console.log(`✅ Welcome email sent to ${email}`);
    } catch (error) {
      console.error('❌ Failed to send welcome email:', error);
      // Don't throw error for welcome email - it's not critical
    }
  }
}

export default EmailService;
