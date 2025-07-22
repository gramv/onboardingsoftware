import nodemailer from 'nodemailer';
import { config } from '@/config/environment';

export class SimpleEmailService {
  private transporter: nodemailer.Transporter | null = null;
  private useMock: boolean = false;

  constructor() {
    this.initializeTransporter();
  }

  /**
   * Initialize SMTP transporter
   */
  private initializeTransporter() {
    try {
      // Check if SMTP credentials are provided
      if (!config.email.smtp.auth.user || !config.email.smtp.auth.pass) {
        console.log('⚠️  SMTP credentials not provided - using mock email service');
        this.useMock = true;
        return;
      }

      this.transporter = nodemailer.createTransport({
        host: config.email.smtp.host,
        port: config.email.smtp.port,
        secure: config.email.smtp.secure,
        auth: {
          user: config.email.smtp.auth.user,
          pass: config.email.smtp.auth.pass,
        },
        tls: {
          rejectUnauthorized: false,
        },
      });

      console.log('✅ Simple SMTP transporter initialized');
    } catch (error) {
      console.error('❌ Failed to initialize SMTP transporter:', error);
      this.useMock = true;
    }
  }

  /**
   * Generate secure access token
   */
  generateAccessCode(): string {
    // Generate a more secure 32-character token
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Send simple onboarding email
   */
  async sendOnboardingEmail(
    email: string,
    name: string,
    company: string,
    token: string,
    baseUrl: string = 'http://localhost:3000'
  ): Promise<void> {
    const onboardingUrl = `${baseUrl}/onboarding?token=${token}`;
    
    const subject = `Welcome to ${company} - Complete Your Onboarding`;
    
    const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Welcome to ${company}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8f9fa; padding: 30px; border-radius: 8px; text-align: center;">
    <h1 style="color: #28a745; margin-bottom: 20px;">🎉 Welcome to ${company}!</h1>
    <p style="font-size: 18px; margin-bottom: 30px;">Hi ${name},</p>
    <p style="font-size: 16px; margin-bottom: 30px;">
      Congratulations! Your application has been approved. Please complete your onboarding process by clicking the button below.
    </p>
    
    <a href="${onboardingUrl}" 
       style="display: inline-block; background-color: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px; margin: 20px 0;">
      Start My Onboarding
    </a>
    
    <p style="font-size: 14px; color: #666; margin-top: 30px;">
      If the button doesn't work, copy and paste this link:<br>
      <a href="${onboardingUrl}">${onboardingUrl}</a>
    </p>
    
    <p style="font-size: 12px; color: #999; margin-top: 30px;">
      This secure link expires in 7 days and is valid for one use only. If you have any questions, please contact your manager or HR.
    </p>
  </div>
</body>
</html>`;

    const textBody = `
Welcome to ${company}!

Hi ${name},

Congratulations! Your application has been approved. Please complete your onboarding process.

Onboarding Link: ${onboardingUrl}

This secure link expires in 7 days and is valid for one use only. If you have any questions, please contact your manager or HR.
`;

    await this.sendEmail(email, subject, htmlBody, textBody);
  }

  /**
   * Send email (with mock fallback)
   */
  private async sendEmail(to: string, subject: string, html: string, text: string): Promise<void> {
    if (this.useMock || !this.transporter) {
      return this.sendMockEmail(to, subject, html, text);
    }

    try {
      const mailOptions = {
        from: `${config.email.from.name} <${config.email.from.email}>`,
        to,
        subject,
        html,
        text,
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log(`📧 Onboarding email sent successfully to ${to}`);
      console.log(`📮 Message ID: ${info.messageId}`);
      
    } catch (error) {
      console.error('❌ Failed to send onboarding email:', error);
      throw new Error(`Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Mock email for development
   */
  private async sendMockEmail(to: string, subject: string, html: string, text: string): Promise<void> {
    console.log('\n=== MOCK ONBOARDING EMAIL ===');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Text: ${text.substring(0, 200)}...`);
    console.log('=== END MOCK EMAIL ===\n');
  }

  /**
   * Test email connection
   */
  async testConnection(): Promise<boolean> {
    if (this.useMock || !this.transporter) {
      console.log('📧 Email service is in mock mode');
      return true;
    }

    try {
      await this.transporter.verify();
      console.log('✅ SMTP connection test successful');
      return true;
    } catch (error) {
      console.error('❌ SMTP connection test failed:', error);
      return false;
    }
  }

  async sendRejectionEmail(
    email: string,
    candidateName: string,
    organizationName: string,
    department: string
  ): Promise<void> {
    const subject = `Thank you for your interest in ${organizationName}`;
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Thank you for your application</h2>
        
        <p>Dear ${candidateName},</p>
        
        <p>Thank you for your interest in the ${department} position at ${organizationName}. 
        We appreciate the time you took to apply and learn about our organization.</p>
        
        <p>After careful consideration, we have decided to move forward with another candidate  
        for this particular role. This decision was not easy, as we received many qualified applications.</p>
        
        <p>We will keep your information on file and will reach out if a suitable opportunity 
        becomes available that matches your background and interests.</p>
        
        <p>We wish you the best in your job search and thank you again for considering ${organizationName}.</p>
        
        <p>Best regards,<br>
        ${organizationName} Hiring Team</p>
      </div>
    `;

    await this.sendEmail(email, subject, htmlContent, htmlContent);
    console.log(`📧 Rejection email sent to ${email}`);
  }
}
