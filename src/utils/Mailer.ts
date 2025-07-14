import nodemailer from 'nodemailer';
import env from '../config/env';

const success_login_html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Successful Login - Checkout</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: 'Outfit', sans-serif;
      line-height: 1.6;
      font-size: 15px;
      font-weight: 300;
      color: #333;
      background-color: #f9f9f9;
    }
    .container {
      max-width: 600px;
      margin: 20px auto;
      background: #fff;
      padding: 20px;
      border-radius: 8px;
    }
    .header-img,
    .footer-img {
      width: 100%;
      height: auto;
      display: block;
      border-radius: 8px 8px 0 0;
    }
    h3 {
      font-weight: 600;
    }
    p {
      margin: 10px 0;
    }
    .footer {
      font-size: 12px;
      color: #777;
      text-align: center;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header Image -->
    <img src="cid:welcomeImage" alt="Checkout Header" class="header-img" />

    <p>Hello {{USER_NAME}},</p>
    <h3>Welcome back! 😊</h3>
    <p>You have successfully logged in to <strong>Checkout</strong>.</p>
    <p>Your account was accessed from:</p>
    <p>IP Address: <strong>{{IP_ADDRESS}}</strong></p>
    <p>Time and Date: <strong>{{LOGIN_DATE}}</strong></p>

    <p>If this was you, you can safely disregard this email.</p>
    <p>If you did not initiate this login, please reset your password immediately and contact support at 
      <a href="mailto:{{MAIL}}">{{MAIL}}</a>.
    </p>

    <p>Thank you,<br>The Checkout Team</p>

    <hr />

    <!-- Footer -->
    <div class="footer">
      <p>&copy; {{CURRENT_YEAR}} Checkout Technologies. All rights reserved.</p>
      <p>You are receiving this email because you signed up on our app.</p>
    </div>

    <!-- Footer Image -->
  </div>
</body>
</html>
`


class Mailer {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({ service: "gmail", auth: { user: env.CHECKOUT_MAIL, pass: env.CHECKOUT_MAIL_PASSWORD, }, });
  }

  async sendMail(to: string, subject: string, text: string, attachments?: nodemailer.Attachment[]): Promise<void> {
    const mailOptions = { from: `Checkout <${env.CHECKOUT_MAIL}>`, to, subject, text, attachments };
    await this.transporter.sendMail(mailOptions);
  }

  async sendMailWithHtml(to: string, subject: string, html: string, attachments?: nodemailer.Attachment[]): Promise<void> {
    const mailOptions = { from: `Checkout <${env.CHECKOUT_MAIL}>`, to, subject, html, attachments };
    await this.transporter.sendMail(mailOptions);
  }

  async successLoginEmail(data: any): Promise<void> {
    const subject = 'Checkout Login Successful';
    const currentDate = new Date().toLocaleString();
    const currentYear = new Date().getFullYear();
    const { name, email, ip } = data;
    
    // Replace placeholders in HTML template
    const htmlContent = success_login_html
      .replace('{{USER_NAME}}', name)
      .replace('{{IP_ADDRESS}}', ip || 'Unknown')
      .replace('{{LOGIN_DATE}}', currentDate)
      .replace('{{CURRENT_YEAR}}', currentYear.toString())
      .replaceAll('{{MAIL}}', env.CHECKOUT_MAIL);

    await this.transporter.sendMail({
      from: `Checkout <${env.CHECKOUT_MAIL}>`,
      to: email,
      subject,
      html: htmlContent,
      attachments: [
        {
          filename: 'welcome.png',
          path: env.IMAGE_PATH || './src/assets/welcome.png',
          cid: 'welcomeImage',
        }
      ]
    });
  }
}

export default new Mailer();

console.log(`Mailer initialized with user: ${env.CHECKOUT_MAIL}`); // Debug logging
// await new Mailer().sendMail('sarafasatar@gmail.com', 'Test Subject', 'Test Email Body');
// await new Mailer().successLoginEmail('sarafasatar@gmail.com', 'Sara');