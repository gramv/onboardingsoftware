export const emailTemplates = {
  rejection: (name: string, department: string) => ({
    subject: 'Application Status Update',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Thank You for Your Interest</h2>
        
        <p>Dear ${name},</p>
        
        <p>Thank you for your interest in the ${department} position with our team. While we were impressed with your qualifications, we have decided to move forward with another candidate for this particular role.</p>
        
        <p>We will keep your information on file and will contact you when suitable opportunities arise that match your skills and experience.</p>
        
        <p>We appreciate the time you took to apply and wish you the best in your job search.</p>
        
        <p>Best regards,<br>
        HR Team</p>
      </div>
    `,
    text: `
      Dear ${name},
      
      Thank you for your interest in the ${department} position. While we were impressed with your qualifications, we have decided to move forward with another candidate for this particular role.
      
      We will keep your information on file and contact you when suitable opportunities arise.
      
      Best regards,
      HR Team
    `
  }),

  editRequest: (employeeName: string, sectionName: string, comments: string, managerEmail?: string) => ({
    subject: `Onboarding Document Edit Required - ${sectionName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Document Edit Required</h2>
        
        <p>Dear ${employeeName},</p>
        
        <p>We need you to make some updates to your <strong>${sectionName}</strong> section in your onboarding documents.</p>
        
        <div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #007bff; margin: 20px 0;">
          <h4 style="margin-top: 0;">Comments from HR:</h4>
          <p style="margin-bottom: 0;">${comments}</p>
        </div>
        
        <p>Please log into your onboarding portal and make the necessary changes. Once you've updated the information, please resubmit the form.</p>
        
        <p>If you have any questions, please don't hesitate to contact us.</p>
        
        <p>Best regards,<br>
        HR Team</p>
      </div>
    `,
    text: `
      Dear ${employeeName},
      
      We need you to make some updates to your ${sectionName} section in your onboarding documents.
      
      Comments from HR: ${comments}
      
      Please log into your onboarding portal and make the necessary changes.
      
      Best regards,
      HR Team
    `,
    cc: managerEmail ? [managerEmail] : undefined
  })
};
