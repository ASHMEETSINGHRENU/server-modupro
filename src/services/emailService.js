const nodemailer = require('nodemailer');

function isEmailConfigured() {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_PORT &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS
  );
}

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

async function sendEnquiryNotifications(enquiry, siteSettings) {
  if (!isEmailConfigured()) {
    return { sent: false, reason: 'SMTP not configured' };
  }

  try {
    const transporter = createTransporter();
    const recipient =
      siteSettings?.notification?.enquiryRecipientEmail ||
      process.env.ENQUIRY_NOTIFICATION_EMAIL ||
      'moduproinnovations2805@gmail.com';
    const fromAddress =
      process.env.SMTP_FROM || `"Modu Pro Innovation" <${process.env.SMTP_USER}>`;

    await transporter.sendMail({
      from: fromAddress,
      to: recipient,
      subject: `[Modu Pro Enquiry ${enquiry.reference}] ${enquiry.divisionName} — ${enquiry.companyName}`,
      text: [
        `New B2B Enquiry Received`,
        `Reference: ${enquiry.reference}`,
        `Full Name: ${enquiry.fullName}`,
        `Company: ${enquiry.companyName}`,
        `Phone: ${enquiry.phone}`,
        `Email: ${enquiry.email}`,
        `Division / Category: ${enquiry.divisionName}`,
        enquiry.serviceCategory ? `Service Category: ${enquiry.serviceCategory}` : null,
        enquiry.machineOrProductDetails
          ? `Machine / Product Details: ${enquiry.machineOrProductDetails}`
          : null,
        `Source Page: ${enquiry.sourcePage}`,
        ``,
        `Requirement / Message:`,
        enquiry.message,
      ]
        .filter(Boolean)
        .join('\n'),
    });

    if (siteSettings?.notification?.sendCustomerAcknowledgement && enquiry.email) {
      await transporter.sendMail({
        from: fromAddress,
        to: enquiry.email,
        subject: `Enquiry Received (${enquiry.reference}) — Modu Pro Innovation Pvt. Ltd.`,
        text: [
          `Dear ${enquiry.fullName},`,
          ``,
          `Thank you for contacting Modu Pro Innovation Pvt. Ltd.`,
          `Your enquiry has been recorded under reference number ${enquiry.reference} and routed to our ${enquiry.divisionName} team.`,
          ``,
          `Summary of your submission:`,
          `- Company: ${enquiry.companyName}`,
          `- Division: ${enquiry.divisionName}`,
          ``,
          `Warm regards,`,
          `Modu Pro Innovation Pvt. Ltd.`,
          `Plot No. 27, Hanuman Daal Mill Road, opposite Royal Touch, Nagpur – 440008`,
        ].join('\n'),
      });
    }

    return { sent: true };
  } catch (error) {
    console.warn('[EmailService] Non-fatal notification failure:', error.message);
    return { sent: false, reason: error.message };
  }
}

module.exports = {
  isEmailConfigured,
  sendEnquiryNotifications,
};
