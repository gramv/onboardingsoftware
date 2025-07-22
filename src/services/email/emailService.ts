import nodemailer from 'nodemailer';
import { config } from '@/config/environment';
import { translationService } from '@/utils/i18n/translationService';
import path from 'path';
import fs from 'fs/promises';

export interface EmailOptions {
    to: string;
    subject: string;
    text?: string;
    html?: string;
    attachments?: Array<{
        filename: string;
        path: string;
        contentType?: string;
    }>;
}

export interface ExperienceLetterEmailOptions {
    employeeName: string;
    employeeEmail: string;
    experienceLetterPath: string;
    organizationName: string;
    locale?: string;
}

export class EmailService {
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
                console.log('💡 To enable real emails, set SMTP_USER and SMTP_PASS environment variables');
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
                    // Do not fail on invalid certificates
                    rejectUnauthorized: false,
                },
            });

            console.log('✅ SMTP transporter initialized successfully');
            console.log(`📧 Email service ready - sending from: ${config.email.from.email}`);
        } catch (error) {
            console.error('❌ Failed to initialize SMTP transporter:', error);
            console.log('🔄 Falling back to mock email service');
            this.useMock = true;
        }
    }

    /**
     * Send a generic email
     */
    async sendEmail(options: EmailOptions): Promise<void> {
        if (this.useMock || !this.transporter) {
            return this.sendMockEmail(options);
        }

        try {
            const mailOptions = {
                from: `${config.email.from.name} <${config.email.from.email}>`,
                to: options.to,
                subject: options.subject,
                text: options.text,
                html: options.html,
                attachments: options.attachments?.map(att => ({
                    filename: att.filename,
                    path: att.path,
                    contentType: att.contentType,
                })),
            };

            const info = await this.transporter.sendMail(mailOptions);
            console.log(`📧 Email sent successfully to ${options.to}`);
            console.log(`📮 Message ID: ${info.messageId}`);
            
            if (info.response) {
                console.log(`📡 Server response: ${info.response}`);
            }
        } catch (error) {
            console.error('❌ Failed to send email:', error);
            
            // Log detailed error information
            if (error instanceof Error) {
                console.error('Error details:', {
                    message: error.message,
                    name: error.name,
                    stack: error.stack?.split('\n').slice(0, 3).join('\n'),
                });
            }
            
            throw new Error(`Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Send mock email (for development/testing)
     */
    private async sendMockEmail(options: EmailOptions): Promise<void> {
        try {
            console.log('=== MOCK EMAIL (SMTP NOT CONFIGURED) ===');
            console.log(`From: ${config.email.from.name} <${config.email.from.email}>`);
            console.log(`To: ${options.to}`);
            console.log(`Subject: ${options.subject}`);
            if (options.text) console.log(`Text: ${options.text.substring(0, 200)}${options.text.length > 200 ? '...' : ''}`);
            if (options.html) console.log(`HTML: ${options.html.substring(0, 200)}${options.html.length > 200 ? '...' : ''}`);
            console.log(`Attachments: ${options.attachments?.length || 0}`);
            if (options.attachments && options.attachments.length > 0) {
                options.attachments.forEach(att => {
                    console.log(`  - ${att.filename} (${att.contentType || 'unknown type'})`);
                });
            }
            console.log('=== END MOCK EMAIL ===');
        } catch (error) {
            console.error('Error in mock email:', error);
            throw new Error('Failed to send mock email');
        }
    }

    /**
     * Send experience letter via email
     */
    async sendExperienceLetter(options: ExperienceLetterEmailOptions): Promise<void> {
        const locale = options.locale || 'en';

        // Check if experience letter file exists
        try {
            await fs.access(options.experienceLetterPath);
        } catch (error) {
            throw new Error('Experience letter file not found');
        }

        const subject = this.getExperienceLetterSubject(options.organizationName, locale);
        const emailBody = this.getExperienceLetterEmailBody(
            options.employeeName,
            options.organizationName,
            locale
        );

        const emailOptions: EmailOptions = {
            to: options.employeeEmail,
            subject,
            html: emailBody,
            text: this.stripHtml(emailBody),
            attachments: [
                {
                    filename: `Experience_Letter_${options.employeeName.replace(/\s+/g, '_')}.pdf`,
                    path: options.experienceLetterPath,
                    contentType: 'application/pdf',
                },
            ],
        };

        await this.sendEmail(emailOptions);
    }

    /**
     * Send off-boarding notification to HR
     */
    async sendOffboardingNotification(
        hrEmail: string,
        employeeName: string,
        employeeId: string,
        terminationDate: Date,
        organizationName: string,
        locale: string = 'en'
    ): Promise<void> {
        const subject = this.getOffboardingNotificationSubject(employeeName, locale);
        const emailBody = this.getOffboardingNotificationBody(
            employeeName,
            employeeId,
            terminationDate,
            organizationName,
            locale
        );

        const emailOptions: EmailOptions = {
            to: hrEmail,
            subject,
            html: emailBody,
            text: this.stripHtml(emailBody),
        };

        await this.sendEmail(emailOptions);
    }

    /**
     * Get localized subject for experience letter email
     */
    private getExperienceLetterSubject(organizationName: string, locale: string): string {
        const strings = this.getLocalizedEmailStrings(locale);
        return strings.experienceLetter.subject.replace('{organization}', organizationName);
    }

    /**
     * Get localized email body for experience letter
     */
    private getExperienceLetterEmailBody(
        employeeName: string,
        organizationName: string,
        locale: string
    ): string {
        const strings = this.getLocalizedEmailStrings(locale);

        return `
<!DOCTYPE html>
<html lang="${locale}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${strings.experienceLetter.subject}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 5px;
            margin-bottom: 20px;
        }
        .content {
            margin-bottom: 20px;
        }
        .footer {
            font-size: 12px;
            color: #666;
            border-top: 1px solid #ddd;
            padding-top: 20px;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h2>${strings.experienceLetter.greeting.replace('{name}', employeeName)}</h2>
    </div>
    
    <div class="content">
        <p>${strings.experienceLetter.body1.replace('{organization}', organizationName)}</p>
        
        <p>${strings.experienceLetter.body2}</p>
        
        <p>${strings.experienceLetter.body3}</p>
        
        <p>${strings.experienceLetter.closing}</p>
    </div>
    
    <div class="footer">
        <p>${strings.experienceLetter.footer.replace('{organization}', organizationName)}</p>
    </div>
</body>
</html>`;
    }

    /**
     * Get localized subject for off-boarding notification
     */
    private getOffboardingNotificationSubject(employeeName: string, locale: string): string {
        const strings = this.getLocalizedEmailStrings(locale);
        return strings.offboarding.subject.replace('{name}', employeeName);
    }

    /**
     * Get localized email body for off-boarding notification
     */
    private getOffboardingNotificationBody(
        employeeName: string,
        employeeId: string,
        terminationDate: Date,
        organizationName: string,
        locale: string
    ): string {
        const strings = this.getLocalizedEmailStrings(locale);
        const formattedDate = new Intl.DateTimeFormat(locale === 'es' ? 'es-ES' : 'en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }).format(terminationDate);

        return `
<!DOCTYPE html>
<html lang="${locale}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${strings.offboarding.subject}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background-color: #fff3cd;
            padding: 20px;
            border-radius: 5px;
            margin-bottom: 20px;
            border-left: 4px solid #ffc107;
        }
        .content {
            margin-bottom: 20px;
        }
        .employee-details {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            margin: 15px 0;
        }
    </style>
</head>
<body>
    <div class="header">
        <h2>${strings.offboarding.title}</h2>
    </div>
    
    <div class="content">
        <p>${strings.offboarding.body1}</p>
        
        <div class="employee-details">
            <strong>${strings.offboarding.employeeDetails}:</strong><br>
            <strong>${strings.offboarding.name}:</strong> ${employeeName}<br>
            <strong>${strings.offboarding.employeeId}:</strong> ${employeeId}<br>
            <strong>${strings.offboarding.terminationDate}:</strong> ${formattedDate}<br>
            <strong>${strings.offboarding.organization}:</strong> ${organizationName}
        </div>
        
        <p>${strings.offboarding.body2}</p>
        
        <p>${strings.offboarding.body3}</p>
    </div>
</body>
</html>`;
    }

    /**
     * Strip HTML tags from text
     */
    private stripHtml(html: string): string {
        return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    }

    /**
     * Get localized email strings
     */
    private getLocalizedEmailStrings(locale: string) {
        const strings = {
            en: {
                experienceLetter: {
                    subject: 'Experience Letter from {organization}',
                    greeting: 'Dear {name},',
                    body1: 'Please find attached your experience letter from {organization}.',
                    body2: 'This document serves as official confirmation of your employment with us and can be used for future job applications or reference purposes.',
                    body3: 'If you need any additional information or have questions about this document, please feel free to contact our HR department.',
                    closing: 'We wish you all the best in your future endeavors.',
                    footer: 'This is an automated message from {organization}. Please do not reply to this email.'
                },
                offboarding: {
                    subject: 'Employee Off-boarding Notification - {name}',
                    title: 'Employee Off-boarding Notification',
                    body1: 'This is to notify you that an employee has been terminated and the off-boarding process has been completed.',
                    body2: 'Please ensure all necessary follow-up actions are taken, including equipment return, access revocation, and final documentation.',
                    body3: 'The experience letter has been automatically generated and sent to the employee.',
                    employeeDetails: 'Employee Details',
                    name: 'Name',
                    employeeId: 'Employee ID',
                    terminationDate: 'Termination Date',
                    organization: 'Organization'
                }
            },
            es: {
                experienceLetter: {
                    subject: 'Carta de Experiencia Laboral de {organization}',
                    greeting: 'Estimado/a {name},',
                    body1: 'Adjunto encontrará su carta de experiencia laboral de {organization}.',
                    body2: 'Este documento sirve como confirmación oficial de su empleo con nosotros y puede ser utilizado para futuras solicitudes de trabajo o propósitos de referencia.',
                    body3: 'Si necesita información adicional o tiene preguntas sobre este documento, no dude en contactar a nuestro departamento de Recursos Humanos.',
                    closing: 'Le deseamos todo lo mejor en sus futuros proyectos.',
                    footer: 'Este es un mensaje automatizado de {organization}. Por favor no responda a este correo.'
                },
                offboarding: {
                    subject: 'Notificación de Desvinculación de Empleado - {name}',
                    title: 'Notificación de Desvinculación de Empleado',
                    body1: 'Esta es una notificación de que un empleado ha sido terminado y el proceso de desvinculación ha sido completado.',
                    body2: 'Por favor asegúrese de que todas las acciones de seguimiento necesarias sean tomadas, incluyendo devolución de equipo, revocación de acceso y documentación final.',
                    body3: 'La carta de experiencia ha sido generada automáticamente y enviada al empleado.',
                    employeeDetails: 'Detalles del Empleado',
                    name: 'Nombre',
                    employeeId: 'ID de Empleado',
                    terminationDate: 'Fecha de Terminación',
                    organization: 'Organización'
                }
            }
        };

        return strings[locale as keyof typeof strings] || strings.en;
    }

    /**
     * Send job application status notification to candidate
     */
    async sendApplicationStatusNotification(
        candidateEmail: string,
        candidateName: string,
        jobTitle: string,
        organizationName: string,
        status: 'approved' | 'rejected',
        reviewNotes?: string,
        locale?: string
    ): Promise<void> {
        const emailLocale = locale || 'en';
        const strings = this.getJobApplicationEmailStrings(emailLocale);
        const subject = status === 'approved' 
            ? strings.approved.subject.replace('{jobTitle}', jobTitle).replace('{organization}', organizationName)
            : strings.rejected.subject.replace('{jobTitle}', jobTitle).replace('{organization}', organizationName);

        const emailBody = this.getJobApplicationEmailBody(
            candidateName,
            jobTitle,
            organizationName,
            status,
            emailLocale,
            reviewNotes
        );

        const emailOptions: EmailOptions = {
            to: candidateEmail,
            subject,
            html: emailBody,
            text: this.stripHtml(emailBody),
        };

        await this.sendEmail(emailOptions);
    }

    /**
     * Get localized email body for job application status
     */
    private getJobApplicationEmailBody(
        candidateName: string,
        jobTitle: string,
        organizationName: string,
        status: 'approved' | 'rejected',
        locale: string,
        reviewNotes?: string
    ): string {
        const strings = this.getJobApplicationEmailStrings(locale);
        const statusStrings = status === 'approved' ? strings.approved : strings.rejected;

        return `
<!DOCTYPE html>
<html lang="${locale}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${statusStrings.subject}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background-color: ${status === 'approved' ? '#d4edda' : '#f8d7da'};
            padding: 20px;
            border-radius: 5px;
            margin-bottom: 20px;
            border-left: 4px solid ${status === 'approved' ? '#28a745' : '#dc3545'};
        }
        .content {
            margin-bottom: 20px;
        }
        .job-details {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            margin: 15px 0;
        }
        .review-notes {
            background-color: #e9ecef;
            padding: 15px;
            border-radius: 5px;
            margin: 15px 0;
            font-style: italic;
        }
        .footer {
            font-size: 12px;
            color: #666;
            border-top: 1px solid #ddd;
            padding-top: 20px;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h2>${statusStrings.greeting.replace('{name}', candidateName)}</h2>
    </div>
    
    <div class="content">
        <p>${statusStrings.body1.replace('{jobTitle}', jobTitle).replace('{organization}', organizationName)}</p>
        
        <div class="job-details">
            <strong>${strings.common.jobDetails}:</strong><br>
            <strong>${strings.common.position}:</strong> ${jobTitle}<br>
            <strong>${strings.common.organization}:</strong> ${organizationName}
        </div>
        
        <p>${statusStrings.body2}</p>
        
        ${reviewNotes ? `
        <div class="review-notes">
            <strong>${strings.common.reviewNotes}:</strong><br>
            ${reviewNotes}
        </div>
        ` : ''}
        
        <p>${statusStrings.closing}</p>
    </div>
    
    <div class="footer">
        <p>${strings.common.footer.replace('{organization}', organizationName)}</p>
    </div>
</body>
</html>`;
    }

    /**
     * Get localized job application email strings
     */
    private getJobApplicationEmailStrings(locale: string) {
        const strings = {
            en: {
                common: {
                    jobDetails: 'Application Details',
                    position: 'Position',
                    organization: 'Organization',
                    reviewNotes: 'Review Notes',
                    footer: 'This is an automated message from {organization}. Please do not reply to this email.'
                },
                approved: {
                    subject: 'Application Approved - {jobTitle} at {organization}',
                    greeting: 'Congratulations {name}!',
                    body1: 'We are pleased to inform you that your application for the {jobTitle} position at {organization} has been approved.',
                    body2: 'Our HR team will contact you shortly with next steps regarding the hiring process, including interview scheduling and onboarding procedures.',
                    closing: 'We look forward to having you join our team!'
                },
                rejected: {
                    subject: 'Application Update - {jobTitle} at {organization}',
                    greeting: 'Dear {name},',
                    body1: 'Thank you for your interest in the {jobTitle} position at {organization}.',
                    body2: 'After careful consideration, we have decided to move forward with other candidates for this position. This decision was difficult as we received many qualified applications.',
                    closing: 'We encourage you to apply for future openings that match your skills and experience. Thank you again for your interest in joining our team.'
                }
            },
            es: {
                common: {
                    jobDetails: 'Detalles de la Aplicación',
                    position: 'Posición',
                    organization: 'Organización',
                    reviewNotes: 'Notas de Revisión',
                    footer: 'Este es un mensaje automatizado de {organization}. Por favor no responda a este correo.'
                },
                approved: {
                    subject: 'Aplicación Aprobada - {jobTitle} en {organization}',
                    greeting: '¡Felicitaciones {name}!',
                    body1: 'Nos complace informarle que su aplicación para la posición de {jobTitle} en {organization} ha sido aprobada.',
                    body2: 'Nuestro equipo de Recursos Humanos se pondrá en contacto con usted próximamente con los siguientes pasos del proceso de contratación, incluyendo programación de entrevistas y procedimientos de incorporación.',
                    closing: '¡Esperamos con ansias que se una a nuestro equipo!'
                },
                rejected: {
                    subject: 'Actualización de Aplicación - {jobTitle} en {organization}',
                    greeting: 'Estimado/a {name},',
                    body1: 'Gracias por su interés en la posición de {jobTitle} en {organization}.',
                    body2: 'Después de una cuidadosa consideración, hemos decidido continuar con otros candidatos para esta posición. Esta decisión fue difícil ya que recibimos muchas aplicaciones calificadas.',
                    closing: 'Le animamos a aplicar para futuras oportunidades que coincidan con sus habilidades y experiencia. Gracias nuevamente por su interés en unirse a nuestro equipo.'
                }
            }
        };

        return strings[locale as keyof typeof strings] || strings.en;
    }

    /**
     * Send onboarding invitation to newly approved candidate
     */
    async sendOnboardingInvitation(
        candidateEmail: string,
        candidateName: string,
        jobTitle: string,
        organizationName: string,
        onboardingUrl: string,
        accessCode: string,
        reviewNotes?: string,
        locale?: string
    ): Promise<void> {
        const emailLocale = locale || 'en';
        const strings = this.getOnboardingInvitationEmailStrings(emailLocale);
        const subject = strings.subject.replace('{jobTitle}', jobTitle).replace('{organization}', organizationName);

        const emailBody = this.getOnboardingInvitationEmailBody(
            candidateName,
            jobTitle,
            organizationName,
            onboardingUrl,
            accessCode,
            emailLocale,
            reviewNotes
        );

        const emailOptions: EmailOptions = {
            to: candidateEmail,
            subject,
            html: emailBody,
            text: this.stripHtml(emailBody),
        };

        await this.sendEmail(emailOptions);
    }

    /**
     * Get localized email body for onboarding invitation
     */
    private getOnboardingInvitationEmailBody(
        candidateName: string,
        jobTitle: string,
        organizationName: string,
        onboardingUrl: string,
        accessCode: string,
        locale: string,
        reviewNotes?: string
    ): string {
        const strings = this.getOnboardingInvitationEmailStrings(locale);

        return `
<!DOCTYPE html>
<html lang="${locale}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${strings.subject}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background-color: #d4edda;
            padding: 20px;
            border-radius: 5px;
            margin-bottom: 20px;
            border-left: 4px solid #28a745;
        }
        .content {
            margin-bottom: 20px;
        }
        .job-details {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            margin: 15px 0;
        }
        .onboarding-section {
            background-color: #e7f3ff;
            padding: 20px;
            border-radius: 5px;
            margin: 20px 0;
            border-left: 4px solid #007bff;
        }
        .access-code {
            font-size: 24px;
            font-weight: bold;
            color: #007bff;
            text-align: center;
            padding: 15px;
            background-color: #fff;
            border-radius: 5px;
            margin: 10px 0;
            letter-spacing: 3px;
        }
        .cta-button {
            display: inline-block;
            background-color: #007bff;
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            margin: 15px 0;
        }
        .review-notes {
            background-color: #e9ecef;
            padding: 15px;
            border-radius: 5px;
            margin: 15px 0;
            font-style: italic;
        }
        .footer {
            font-size: 12px;
            color: #666;
            border-top: 1px solid #ddd;
            padding-top: 20px;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h2>${strings.greeting.replace('{name}', candidateName)}</h2>
    </div>
    
    <div class="content">
        <p>${strings.body1.replace('{jobTitle}', jobTitle).replace('{organization}', organizationName)}</p>
        
        <div class="job-details">
            <strong>${strings.jobDetails}:</strong><br>
            <strong>${strings.position}:</strong> ${jobTitle}<br>
            <strong>${strings.organization}:</strong> ${organizationName}
        </div>
        
        ${reviewNotes ? `
        <div class="review-notes">
            <strong>${strings.reviewNotes}:</strong><br>
            ${reviewNotes}
        </div>
        ` : ''}
        
        <div class="onboarding-section">
            <h3>${strings.onboardingTitle}</h3>
            <p>${strings.onboardingInstructions}</p>
            
            <div class="access-code">
                ${accessCode}
            </div>
            
            <p style="text-align: center;">
                <a href="${onboardingUrl}" class="cta-button">${strings.startOnboarding}</a>
            </p>
            
            <p><strong>${strings.importantNote}:</strong></p>
            <ul>
                <li>${strings.note1}</li>
                <li>${strings.note2}</li>
                <li>${strings.note3}</li>
                <li>${strings.note4}</li>
            </ul>
        </div>
        
        <p>${strings.closing}</p>
        
        <p>${strings.support}</p>
    </div>
    
    <div class="footer">
        <p>${strings.footer.replace('{organization}', organizationName)}</p>
    </div>
</body>
</html>`;
    }

    /**
     * Get localized onboarding invitation email strings
     */
    private getOnboardingInvitationEmailStrings(locale: string) {
        const strings = {
            en: {
                subject: 'Welcome to {organization} - Complete Your Onboarding for {jobTitle}',
                greeting: 'Congratulations {name}!',
                body1: 'We are excited to welcome you to {organization} as our new {jobTitle}. Your application has been approved and we\'re ready to get you started!',
                jobDetails: 'Position Details',
                position: 'Position',
                organization: 'Organization',
                reviewNotes: 'Manager Notes',
                onboardingTitle: '🎉 Next Steps: Complete Your Onboarding',
                onboardingInstructions: 'To get started, please use the access code below to begin your secure onboarding process:',
                startOnboarding: 'Start My Onboarding',
                importantNote: 'Important Information',
                note1: 'Your access code expires in 7 days',
                note2: 'Please have your driver\'s license and Social Security card ready',
                note3: 'The onboarding process takes approximately 15-20 minutes',
                note4: 'You can save your progress and return later if needed',
                closing: 'We look forward to having you join our team and can\'t wait to get you started!',
                support: 'If you have any questions or need assistance, please contact your manager or our HR department.',
                footer: 'This is an automated message from {organization}. Please do not reply to this email.'
            },
            es: {
                subject: 'Bienvenido a {organization} - Complete Su Incorporación para {jobTitle}',
                greeting: '¡Felicitaciones {name}!',
                body1: 'Estamos emocionados de darle la bienvenida a {organization} como nuestro nuevo {jobTitle}. Su aplicación ha sido aprobada y estamos listos para comenzar!',
                jobDetails: 'Detalles del Puesto',
                position: 'Posición',
                organization: 'Organización',
                reviewNotes: 'Notas del Gerente',
                onboardingTitle: '🎉 Próximos Pasos: Complete Su Incorporación',
                onboardingInstructions: 'Para comenzar, por favor use el código de acceso a continuación para iniciar su proceso seguro de incorporación:',
                startOnboarding: 'Comenzar Mi Incorporación',
                importantNote: 'Información Importante',
                note1: 'Su código de acceso expira en 7 días',
                note2: 'Por favor tenga lista su licencia de conducir y tarjeta de Seguro Social',
                note3: 'El proceso de incorporación toma aproximadamente 15-20 minutos',
                note4: 'Puede guardar su progreso y regresar más tarde si es necesario',
                closing: '¡Esperamos con ansias que se una a nuestro equipo y estamos emocionados de comenzar!',
                support: 'Si tiene alguna pregunta o necesita asistencia, por favor contacte a su gerente o nuestro departamento de Recursos Humanos.',
                footer: 'Este es un mensaje automatizado de {organization}. Por favor no responda a este correo.'
            }
        };

        return strings[locale as keyof typeof strings] || strings.en;
    }

    /**
     * Test email configuration
     */
    async testConnection(): Promise<boolean> {
        if (this.useMock || !this.transporter) {
            console.log('📧 Email service is in mock mode');
            return true;
        }

        try {
            console.log('🔍 Testing SMTP connection...');
            await this.transporter.verify();
            console.log('✅ SMTP connection test successful');
            return true;
        } catch (error) {
            console.error('❌ SMTP connection test failed:', error);
            return false;
        }
    }

    /**
     * Send a test email
     */
    async sendTestEmail(to: string): Promise<void> {
        const testEmailOptions: EmailOptions = {
            to,
            subject: 'Test Email from Motel Management System',
            html: `
                <h2>Test Email</h2>
                <p>This is a test email from your Motel Management System.</p>
                <p>If you received this email, your SMTP configuration is working correctly!</p>
                <p>Sent at: ${new Date().toLocaleString()}</p>
            `,
            text: `Test Email - This is a test email from your Motel Management System. If you received this email, your SMTP configuration is working correctly! Sent at: ${new Date().toLocaleString()}`,
        };

        await this.sendEmail(testEmailOptions);
    }
}