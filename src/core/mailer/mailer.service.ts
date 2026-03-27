import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';

@Injectable()
export class MailService {
  constructor(private mailerService: MailerService) {}

  async sendVerificationEmail(email: string, token: string) {
    try {
      const encodedToken = encodeURIComponent(token);
      const url = `${process.env.APP_URL}/verify?token=${encodedToken}`;
      await this.mailerService.sendMail({
        to: email,
        subject: 'Verify your account',
        html: `<!doctype html>
             <html lang="en">
               <head>
                 <meta charset="utf-8" />
                 <meta name="viewport" content="width=device-width, initial-scale=1" />
                 <title>Verify your account</title>
               </head>
               <body style="margin:0;padding:0;background:#f6f1e8;font-family:Trebuchet MS, Verdana, Arial, sans-serif;color:#1f1f1f;">
                 <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f6f1e8;padding:32px 16px;">
                   <tr>
                     <td align="center">
                       <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="width:100%;max-width:600px;background:#ffffff;border-radius:16px;box-shadow:0 10px 30px rgba(0,0,0,0.08);overflow:hidden;">
                         <tr>
                           <td style="padding:28px 32px;background:linear-gradient(135deg,#ffb36c,#f97316);color:#1f1f1f;">
                             <h1 style="margin:0;font-size:24px;letter-spacing:0.5px;">Verify your account</h1>
                             <p style="margin:8px 0 0;font-size:14px;">Just one step to finish setting up your profile.</p>
                           </td>
                         </tr>
                         <tr>
                           <td style="padding:28px 32px;">
                             <p style="margin:0 0 12px;font-size:16px;line-height:1.5;">
                               Click the button below to confirm your email address and activate your account.
                             </p>
                             <table role="presentation" cellspacing="0" cellpadding="0" style="margin:20px 0 24px;">
                               <tr>
                                 <td bgcolor="#1f2937" style="border-radius:10px;">
                                   <a href="${url}" style="display:inline-block;padding:14px 22px;font-size:15px;color:#ffffff;text-decoration:none;font-weight:600;">Verify email</a>
                                 </td>
                               </tr>
                             </table>
                             <p style="margin:0 0 10px;font-size:13px;color:#5a5a5a;">
                               If the button does not work, copy and paste this link into your browser:
                             </p>
                             <p style="margin:0;font-size:12px;word-break:break-all;">
                               <a href="${url}" style="color:#f97316;text-decoration:none;">${url}</a>
                             </p>
                           </td>
                         </tr>
                         <tr>
                           <td style="padding:18px 32px 28px;font-size:12px;color:#7a7a7a;">
                             This link expires soon for your security. If you did not request this, you can safely ignore this email.
                           </td>
                         </tr>
                       </table>
                     </td>
                   </tr>
                 </table>
               </body>
             </html>`,
      });
    } catch (error) {
      console.log('Error while Sending Verification Email', error);
      throw new Error('Failed to send verification email');
    }
  }
}
