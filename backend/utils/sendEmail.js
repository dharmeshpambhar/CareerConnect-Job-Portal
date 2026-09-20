import nodemailer from "nodemailer";

let cachedTransporter = null;

const getTransporter = () => {
  if (!cachedTransporter) {
    cachedTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === "true",
      connectionTimeout: 3500, // 3.5s max to prevent hanging
      greetingTimeout: 3000,
      socketTimeout: 4000, // 4s socket timeout
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return cachedTransporter;
};

/**
 * Sends an email using the configured SMTP transporter.
 * @param {Object} options
 * @param {string} options.to       - Recipient email address
 * @param {string} options.subject  - Email subject
 * @param {string} options.html     - HTML body of the email
 */
const sendEmail = async ({ to, subject, html }) => {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log(`[SMTP Skipped] No credentials set for ${to}`);
      return { skipped: true };
    }

    const transporter = getTransporter();
    const mailOptions = {
      from: `"${process.env.SMTP_FROM_NAME || "CareerConnect"}" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to ${to} | MessageId: ${info.messageId}`);
    return info;
  } catch (err) {
    console.error(`Email sending failed for ${to}:`, err.message);
    return { error: err.message };
  }
};

export default sendEmail;
