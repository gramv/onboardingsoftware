import puppeteer from 'puppeteer';
import { Employee, User, Organization } from '@prisma/client';
import { translationService } from '@/utils/i18n/translationService';
import path from 'path';
import fs from 'fs/promises';

// Type for Employee with User and Organization relations
type EmployeeWithDetails = Employee & {
  user: User & {
    organization: Organization;
  };
};

export interface ExperienceLetterData {
  employee: EmployeeWithDetails;
  terminationDate: Date;
  managerRating: number;
  position: string;
  department?: string;
  hireDate: Date;
  workDuration: string;
  locale?: string;
}

export interface ExperienceLetterOptions {
  includeRating?: boolean;
  includeRecommendation?: boolean;
  customMessage?: string;
  locale?: string;
}

export class ExperienceLetterService {
  private readonly templatesDir = path.join(process.cwd(), 'templates', 'experience-letters');
  private readonly outputDir = path.join(process.cwd(), 'storage', 'documents', 'experience-letters');

  constructor() {
    this.ensureDirectoriesExist();
  }

  /**
   * Generate experience letter PDF for terminated employee
   */
  async generateExperienceLetter(
    employee: EmployeeWithDetails,
    options: ExperienceLetterOptions = {}
  ): Promise<string> {
    const locale = options.locale || employee.user.languagePreference || 'en';
    
    // Calculate work duration
    const workDuration = this.calculateWorkDuration(
      employee.hireDate,
      employee.terminationDate || new Date(),
      locale
    );

    const letterData: ExperienceLetterData = {
      employee,
      terminationDate: employee.terminationDate || new Date(),
      managerRating: employee.managerRating || 3,
      position: employee.position || 'Employee',
      department: employee.department || undefined,
      hireDate: employee.hireDate,
      workDuration,
      locale
    };

    // Generate HTML content
    const htmlContent = await this.generateHTMLContent(letterData, options);

    // Generate PDF
    const pdfPath = await this.generatePDF(htmlContent, employee.employeeId, locale);

    return pdfPath;
  }

  /**
   * Generate HTML content for experience letter
   */
  private async generateHTMLContent(
    data: ExperienceLetterData,
    options: ExperienceLetterOptions
  ): Promise<string> {
    const { employee, locale } = data;
    const org = employee.user.organization;

    // Get localized strings
    const strings = this.getLocalizedStrings(locale || 'en');

    // Generate recommendation text based on rating
    const recommendation = this.generateRecommendation(data.managerRating, locale || 'en');

    const html = `
<!DOCTYPE html>
<html lang="${locale}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${strings.title}</title>
    <style>
        body {
            font-family: 'Times New Roman', serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 40px 20px;
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
        }
        .company-name {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 10px;
        }
        .company-address {
            font-size: 14px;
            color: #666;
        }
        .letter-title {
            text-align: center;
            font-size: 20px;
            font-weight: bold;
            margin: 40px 0;
            text-decoration: underline;
        }
        .date {
            text-align: right;
            margin-bottom: 30px;
        }
        .content {
            text-align: justify;
            margin-bottom: 30px;
        }
        .employee-details {
            background-color: #f9f9f9;
            padding: 20px;
            border-left: 4px solid #007bff;
            margin: 20px 0;
        }
        .signature-section {
            margin-top: 60px;
        }
        .signature-line {
            border-top: 1px solid #333;
            width: 300px;
            margin-top: 40px;
        }
        .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 12px;
            color: #666;
            border-top: 1px solid #ddd;
            padding-top: 20px;
        }
        .rating-section {
            background-color: #e8f4fd;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="company-name">${org.name}</div>
        <div class="company-address">
            ${this.formatAddress(org.address as any)}
        </div>
    </div>

    <div class="date">
        ${strings.date}: ${this.formatDate(data.terminationDate, locale || 'en')}
    </div>

    <div class="letter-title">
        ${strings.title}
    </div>

    <div class="content">
        <p>${strings.greeting},</p>

        <p>${strings.intro.replace('{name}', `${employee.user.firstName} ${employee.user.lastName}`)
                          .replace('{employeeId}', employee.employeeId)
                          .replace('{company}', org.name)}</p>

        <div class="employee-details">
            <strong>${strings.employeeDetails}:</strong><br>
            <strong>${strings.fullName}:</strong> ${employee.user.firstName} ${employee.user.lastName}<br>
            <strong>${strings.employeeId}:</strong> ${employee.employeeId}<br>
            <strong>${strings.position}:</strong> ${data.position}<br>
            ${data.department ? `<strong>${strings.department}:</strong> ${data.department}<br>` : ''}
            <strong>${strings.employmentPeriod}:</strong> ${this.formatDate(data.hireDate, locale || 'en')} ${strings.to} ${this.formatDate(data.terminationDate, locale || 'en')}<br>
            <strong>${strings.duration}:</strong> ${data.workDuration}
        </div>

        <p>${strings.performance.replace('{name}', employee.user.firstName)}</p>

        ${options.includeRating && data.managerRating ? `
        <div class="rating-section">
            <strong>${strings.performanceRating}:</strong> ${data.managerRating}/5<br>
            <strong>${strings.recommendation}:</strong> ${recommendation}
        </div>
        ` : ''}

        ${options.customMessage ? `<p>${options.customMessage}</p>` : ''}

        <p>${strings.closing.replace('{name}', employee.user.firstName)}</p>

        <p>${strings.contact}</p>
    </div>

    <div class="signature-section">
        <p>${strings.sincerely},</p>
        <div class="signature-line"></div>
        <p><strong>${strings.hrManager}</strong><br>
        ${org.name}</p>
    </div>

    <div class="footer">
        ${strings.footer.replace('{company}', org.name)}
    </div>
</body>
</html>`;

    return html;
  }

  /**
   * Generate PDF from HTML content
   */
  private async generatePDF(
    htmlContent: string,
    employeeId: string,
    locale: string
  ): Promise<string> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
      const page = await browser.newPage();
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `experience-letter-${employeeId}-${timestamp}.pdf`;
      const outputPath = path.join(this.outputDir, filename);

      await page.pdf({
        path: outputPath,
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '20mm',
          bottom: '20mm',
          left: '20mm'
        }
      });

      return outputPath;
    } finally {
      await browser.close();
    }
  }

  /**
   * Calculate work duration in human-readable format
   */
  private calculateWorkDuration(hireDate: Date, terminationDate: Date, locale: string): string {
    const diffTime = Math.abs(terminationDate.getTime() - hireDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    const years = Math.floor(diffDays / 365);
    const months = Math.floor((diffDays % 365) / 30);
    const days = diffDays % 30;

    const strings = this.getLocalizedStrings(locale);

    let duration = '';
    if (years > 0) {
      duration += `${years} ${years === 1 ? strings.year : strings.years}`;
    }
    if (months > 0) {
      if (duration) duration += ', ';
      duration += `${months} ${months === 1 ? strings.month : strings.months}`;
    }
    if (days > 0 && years === 0) {
      if (duration) duration += ', ';
      duration += `${days} ${days === 1 ? strings.day : strings.days}`;
    }

    return duration || `1 ${strings.day}`;
  }

  /**
   * Generate recommendation text based on rating
   */
  private generateRecommendation(rating: number, locale: string): string {
    const strings = this.getLocalizedStrings(locale);

    if (rating >= 5) return strings.recommendations.excellent;
    if (rating >= 4) return strings.recommendations.good;
    if (rating >= 3) return strings.recommendations.satisfactory;
    if (rating >= 2) return strings.recommendations.needsImprovement;
    return strings.recommendations.unsatisfactory;
  }

  /**
   * Format address object to string
   */
  private formatAddress(address: any): string {
    if (!address) return '';
    
    const parts = [];
    if (address.street) parts.push(address.street);
    if (address.city) parts.push(address.city);
    if (address.state) parts.push(address.state);
    if (address.zipCode) parts.push(address.zipCode);
    
    return parts.join(', ');
  }

  /**
   * Format date according to locale
   */
  private formatDate(date: Date, locale: string): string {
    return new Intl.DateTimeFormat(locale === 'es' ? 'es-ES' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  }

  /**
   * Get localized strings for experience letter
   */
  private getLocalizedStrings(locale: string) {
    const strings = {
      en: {
        title: 'Experience Letter',
        date: 'Date',
        greeting: 'To Whom It May Concern',
        intro: 'This is to certify that {name} (Employee ID: {employeeId}) was employed with {company} in the capacity mentioned below.',
        employeeDetails: 'Employee Details',
        fullName: 'Full Name',
        employeeId: 'Employee ID',
        position: 'Position',
        department: 'Department',
        employmentPeriod: 'Employment Period',
        duration: 'Duration',
        to: 'to',
        performance: 'During the tenure with us, {name} has shown dedication and professionalism in their work.',
        performanceRating: 'Performance Rating',
        recommendation: 'Recommendation',
        closing: 'We wish {name} all the best in their future endeavors.',
        contact: 'For any further information, please feel free to contact us.',
        sincerely: 'Sincerely',
        hrManager: 'Human Resources Manager',
        footer: 'This is a computer-generated document from {company}.',
        year: 'year',
        years: 'years',
        month: 'month',
        months: 'months',
        day: 'day',
        days: 'days',
        recommendations: {
          excellent: 'Highly recommended for future employment',
          good: 'Recommended for future employment',
          satisfactory: 'Eligible for future employment',
          needsImprovement: 'May be considered for future employment',
          unsatisfactory: 'Not recommended for future employment'
        }
      },
      es: {
        title: 'Carta de Experiencia Laboral',
        date: 'Fecha',
        greeting: 'A Quien Corresponda',
        intro: 'Por medio de la presente certificamos que {name} (ID de Empleado: {employeeId}) trabajó con {company} en la capacidad mencionada a continuación.',
        employeeDetails: 'Detalles del Empleado',
        fullName: 'Nombre Completo',
        employeeId: 'ID de Empleado',
        position: 'Posición',
        department: 'Departamento',
        employmentPeriod: 'Período de Empleo',
        duration: 'Duración',
        to: 'a',
        performance: 'Durante su tiempo con nosotros, {name} ha demostrado dedicación y profesionalismo en su trabajo.',
        performanceRating: 'Calificación de Desempeño',
        recommendation: 'Recomendación',
        closing: 'Le deseamos a {name} todo lo mejor en sus futuros proyectos.',
        contact: 'Para cualquier información adicional, no dude en contactarnos.',
        sincerely: 'Atentamente',
        hrManager: 'Gerente de Recursos Humanos',
        footer: 'Este es un documento generado por computadora de {company}.',
        year: 'año',
        years: 'años',
        month: 'mes',
        months: 'meses',
        day: 'día',
        days: 'días',
        recommendations: {
          excellent: 'Altamente recomendado para empleo futuro',
          good: 'Recomendado para empleo futuro',
          satisfactory: 'Elegible para empleo futuro',
          needsImprovement: 'Puede ser considerado para empleo futuro',
          unsatisfactory: 'No recomendado para empleo futuro'
        }
      }
    };

    return strings[locale as keyof typeof strings] || strings.en;
  }

  /**
   * Ensure required directories exist
   */
  private async ensureDirectoriesExist(): Promise<void> {
    try {
      await fs.mkdir(this.templatesDir, { recursive: true });
      await fs.mkdir(this.outputDir, { recursive: true });
    } catch (error) {
      console.error('Error creating directories:', error);
    }
  }

  /**
   * Clean up old experience letter files (older than 30 days)
   */
  async cleanupOldFiles(): Promise<void> {
    try {
      const files = await fs.readdir(this.outputDir);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      for (const file of files) {
        const filePath = path.join(this.outputDir, file);
        const stats = await fs.stat(filePath);
        
        if (stats.mtime < thirtyDaysAgo) {
          await fs.unlink(filePath);
          console.log(`Cleaned up old experience letter: ${file}`);
        }
      }
    } catch (error) {
      console.error('Error cleaning up old files:', error);
    }
  }
}