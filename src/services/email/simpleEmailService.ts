import nodemailer from 'nodemailer';
import { config } from '../../config/environment';

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
   * Send job approval email with onboarding link
   */
  async sendJobApprovalEmail(
    email: string,
    candidateName: string,
    organizationName: string,
    jobTitle: string,
    payRate: string,
    benefits: string,
    startDate: string,
    onboardingToken: string,
    baseUrl: string
  ): Promise<void> {
    const onboardingUrl = `${baseUrl}/onboarding?token=${onboardingToken}`;
    
    const subject = `🎉 Congratulations! Job Offer from ${organizationName}`;
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px;">🎉 Congratulations!</h1>
          <p style="margin: 10px 0 0 0; font-size: 18px;">You've been selected for the position!</p>
        </div>
        
        <div style="padding: 30px; background: #f8f9fa;">
          <h2 style="color: #333; margin-top: 0;">Dear ${candidateName},</h2>
          
          <p style="font-size: 16px; line-height: 1.6; color: #555;">
            We are excited to offer you the position of <strong>${jobTitle}</strong> at ${organizationName}!
          </p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Position Details:</h3>
            <ul style="color: #555; line-height: 1.8;">
              <li><strong>Position:</strong> ${jobTitle}</li>
              <li><strong>Pay Rate:</strong> ${payRate}</li>
              <li><strong>Benefits:</strong> ${benefits}</li>
              <li><strong>Start Date:</strong> ${startDate}</li>
            </ul>
          </div>
          
          <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1976d2; margin-top: 0;">🚀 Next Steps - Complete Your Onboarding</h3>
            <p style="color: #555; margin-bottom: 20px;">
              To finalize your employment, please complete your onboarding process by clicking the button below. 
              This will include filling out required forms (I-9, W-4) and reviewing company policies.
            </p>
            
            <div style="text-align: center;">
              <a href="${onboardingUrl}" 
                 style="background: #1976d2; color: white; padding: 15px 30px; text-decoration: none; 
                        border-radius: 5px; font-weight: bold; display: inline-block;">
                Start Onboarding Process
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px; margin-top: 15px;">
              <strong>Important:</strong> Please complete your onboarding within 7 days of receiving this email.
            </p>
          </div>
          
          <p style="color: #555; line-height: 1.6;">
            If you have any questions, please don't hesitate to contact your manager or HR department.
          </p>
          
          <p style="color: #555; line-height: 1.6;">
            Welcome to the team!<br>
            <strong>${organizationName} Management</strong>
          </p>
        </div>
        
        <div style="background: #333; color: #ccc; padding: 20px; text-align: center; font-size: 12px;">
          <p>This is an automated message from ${organizationName}</p>
          <p>If you cannot click the button above, copy and paste this link: ${onboardingUrl}</p>
        </div>
      </div>
    `;

    const textContent = `
Congratulations! Job Offer from ${organizationName}

Dear ${candidateName},

We are excited to offer you the position of ${jobTitle} at ${organizationName}!

Position Details:
- Position: ${jobTitle}
- Pay Rate: ${payRate}
- Benefits: ${benefits}
- Start Date: ${startDate}

Next Steps - Complete Your Onboarding:
To finalize your employment, please complete your onboarding process by visiting: ${onboardingUrl}

This will include filling out required forms (I-9, W-4) and reviewing company policies.

Important: Please complete your onboarding within 7 days of receiving this email.

If you have any questions, please don't hesitate to contact your manager or HR department.

Welcome to the team!
${organizationName} Management
    `;

    await this.sendEmail(email, subject, htmlContent, textContent);
  }

  /**
   * Send job rejection email and save to talent pool
   */
  async sendJobRejectionEmail(
    email: string,
    candidateName: string,
    organizationName: string,
    jobTitle: string
  ): Promise<void> {
    const subject = `Update on Your Application - ${organizationName}`;
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #f8f9fa; padding: 30px;">
          <h2 style="color: #333; margin-top: 0;">Dear ${candidateName},</h2>
          
          <p style="font-size: 16px; line-height: 1.6; color: #555;">
            Thank you for your interest in the <strong>${jobTitle}</strong> position at ${organizationName} 
            and for taking the time to apply.
          </p>
          
          <p style="font-size: 16px; line-height: 1.6; color: #555;">
            After careful consideration, we have decided to move forward with another candidate 
            for this particular role. This decision was not easy, as we received many qualified applications.
          </p>
          
          <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #2e7d32; margin-top: 0;">🌟 Stay Connected</h3>
            <p style="color: #555; margin-bottom: 0;">
              We were impressed with your qualifications and would like to keep your information 
              on file for future opportunities that may be a better fit. We will reach out if 
              a suitable position becomes available.
            </p>
          </div>
          
          <p style="color: #555; line-height: 1.6;">
            We appreciate your interest in ${organizationName} and wish you the best in your job search.
          </p>
          
          <p style="color: #555; line-height: 1.6;">
            Best regards,<br>
            <strong>${organizationName} Hiring Team</strong>
          </p>
        </div>
      </div>
    `;

    const textContent = `
Update on Your Application - ${organizationName}

Dear ${candidateName},

Thank you for your interest in the ${jobTitle} position at ${organizationName} and for taking the time to apply.

After careful consideration, we have decided to move forward with another candidate for this particular role. This decision was not easy, as we received many qualified applications.

Stay Connected:
We were impressed with your qualifications and would like to keep your information on file for future opportunities that may be a better fit. We will reach out if a suitable position becomes available.

We appreciate your interest in ${organizationName} and wish you the best in your job search.

Best regards,
${organizationName} Hiring Team
    `;

    await this.sendEmail(email, subject, htmlContent, textContent);
  }

  /**
   * Send edit request email to employee
   */
  async sendEditRequestEmail(
    email: string,
    employeeName: string,
    organizationName: string,
    editRequests: any[],
    onboardingToken: string
  ): Promise<void> {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const onboardingUrl = `${baseUrl}/onboarding?token=${onboardingToken}`;
    
    const subject = `Action Required: Update Your Onboarding Information - ${organizationName}`;
    
    const requestsList = editRequests.map(req => 
      `<li><strong>${req.section}</strong> - ${req.field}: ${req.reason}</li>`
    ).join('');

    const requestsListText = editRequests.map(req => 
      `- ${req.section} - ${req.field}: ${req.reason}`
    ).join('\n');
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #fff3cd; padding: 30px; text-align: center; border-left: 4px solid #ffc107;">
          <h1 style="margin: 0; font-size: 28px; color: #856404;">⚠️ Action Required</h1>
          <p style="margin: 10px 0 0 0; font-size: 18px; color: #856404;">Please update your onboarding information</p>
        </div>
        
        <div style="padding: 30px; background: #f8f9fa;">
          <h2 style="color: #333; margin-top: 0;">Hello ${employeeName},</h2>
          
          <p style="font-size: 16px; line-height: 1.6; color: #555;">
            Our HR team has reviewed your onboarding information and needs you to make some updates 
            to complete your employment process.
          </p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">📝 Required Updates:</h3>
            <ul style="color: #555; line-height: 1.8;">
              ${requestsList}
            </ul>
          </div>
          
          <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1976d2; margin-top: 0;">🔗 Update Your Information</h3>
            <p style="color: #555; margin-bottom: 20px;">
              Please click the button below to access your onboarding form and make the requested changes.
            </p>
            
            <div style="text-align: center;">
              <a href="${onboardingUrl}" 
                 style="background: #1976d2; color: white; padding: 15px 30px; text-decoration: none; 
                        border-radius: 5px; font-weight: bold; display: inline-block;">
                Update Onboarding Information
              </a>
            </div>
          </div>
          
          <p style="color: #555; line-height: 1.6;">
            If you have any questions about these updates, please contact your manager or HR department.
          </p>
          
          <p style="color: #555; line-height: 1.6;">
            Thank you,<br>
            <strong>${organizationName} HR Team</strong>
          </p>
        </div>
        
        <div style="background: #333; color: #ccc; padding: 20px; text-align: center; font-size: 12px;">
          <p>This is an automated message from ${organizationName}</p>
          <p>If you cannot click the button above, copy and paste this link: ${onboardingUrl}</p>
        </div>
      </div>
    `;

    const textContent = `
Action Required: Update Your Onboarding Information - ${organizationName}

Hello ${employeeName},

Our HR team has reviewed your onboarding information and needs you to make some updates to complete your employment process.

Required Updates:
${requestsListText}

Update Your Information:
Please visit the following link to access your onboarding form and make the requested changes:
${onboardingUrl}

If you have any questions about these updates, please contact your manager or HR department.

Thank you,
${organizationName} HR Team
    `;

    await this.sendEmail(email, subject, htmlContent, textContent);
  }

  /**
   * Send edit request notification to manager
   */
  async sendEditRequestNotificationToManager(
    managerEmail: string,
    employeeName: string,
    editRequests: any[]
  ): Promise<void> {
    const subject = `HR Edit Request - ${employeeName} Onboarding`;
    
    const requestsList = editRequests.map(req => 
      `<li><strong>${req.section}</strong> - ${req.field}: ${req.reason}</li>`
    ).join('');

    const requestsListText = editRequests.map(req => 
      `- ${req.section} - ${req.field}: ${req.reason}`
    ).join('\n');
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="padding: 30px; background: #f8f9fa;">
          <h2 style="color: #333; margin-top: 0;">HR Edit Request Notification</h2>
          
          <p style="font-size: 16px; line-height: 1.6; color: #555;">
            HR has requested changes to <strong>${employeeName}</strong>'s onboarding information.
          </p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">📝 Requested Changes:</h3>
            <ul style="color: #555; line-height: 1.8;">
              ${requestsList}
            </ul>
          </div>
          
          <p style="color: #555; line-height: 1.6;">
            The employee has been notified and will update their information accordingly.
          </p>
        </div>
      </div>
    `;

    const textContent = `
HR Edit Request - ${employeeName} Onboarding

HR has requested changes to ${employeeName}'s onboarding information.

Requested Changes:
${requestsListText}

The employee has been notified and will update their information accordingly.
    `;

    await this.sendEmail(managerEmail, subject, htmlContent, textContent);
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
}
