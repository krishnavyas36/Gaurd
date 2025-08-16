import nodemailer from 'nodemailer';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const emailHost = process.env.EMAIL_HOST;
    const emailPort = process.env.EMAIL_PORT;
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;

    if (!emailHost || !emailPort || !emailUser || !emailPass) {
      console.warn("Email configuration incomplete - Email notifications disabled");
      return;
    }

    const config: EmailConfig = {
      host: emailHost,
      port: parseInt(emailPort),
      secure: parseInt(emailPort) === 465,
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    };

    this.transporter = nodemailer.createTransporter(config);
  }

  async sendSecurityAlert(
    to: string | string[],
    title: string,
    description: string,
    severity: string
  ) {
    if (!this.transporter) {
      console.log("Email not configured, would have sent security alert:", { to, title, description, severity });
      return;
    }

    const severityColors = {
      critical: "#D32F2F",
      warning: "#F57C00",
      info: "#1976D2"
    };

    const color = severityColors[severity as keyof typeof severityColors] || "#1976D2";

    const htmlContent = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: ${color}; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; font-size: 24px;">🛡️ WalletGyde Security Alert</h1>
            </div>
            <div style="background: #f9f9f9; padding: 20px; border: 1px solid #ddd; border-radius: 0 0 8px 8px;">
              <div style="background: white; padding: 15px; border-radius: 4px; margin-bottom: 15px;">
                <h2 style="color: ${color}; margin-top: 0;">${title}</h2>
                <p style="margin-bottom: 15px;">${description}</p>
                <div style="background: #f5f5f5; padding: 10px; border-radius: 4px;">
                  <strong>Severity:</strong> ${severity.toUpperCase()}<br>
                  <strong>Time:</strong> ${new Date().toLocaleString()}
                </div>
              </div>
              <p style="color: #666; font-size: 14px; margin: 0;">
                This is an automated security alert from WalletGyde Security Agent.
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: Array.isArray(to) ? to.join(", ") : to,
      subject: `[WalletGyde Security] ${severity.toUpperCase()}: ${title}`,
      html: htmlContent,
      text: `WalletGyde Security Alert\n\nSeverity: ${severity.toUpperCase()}\nTitle: ${title}\nDescription: ${description}\nTime: ${new Date().toLocaleString()}`
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`Security alert email sent to ${to}`);
    } catch (error) {
      console.error("Error sending security alert email:", error);
      throw error;
    }
  }

  async sendComplianceReport(to: string | string[], reportData: any) {
    if (!this.transporter) {
      console.log("Email not configured, would have sent compliance report:", { to, reportData });
      return;
    }

    // Implementation for sending compliance reports
    // This would format the report data into a readable email
  }
}

export const emailService = new EmailService();
