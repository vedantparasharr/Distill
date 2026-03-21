import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });

export const sendOtpEmail = async ({ toEmail, username, otp }) => {
  const fromEmail = process.env.EMAIL_FROM;
  const apiKey = process.env.BREVO_API_KEY;
  const appName = process.env.APP_NAME || "DistillLearn";

  if (!fromEmail) {
    throw new Error("EMAIL_FROM must be configured");
  }

  if (!apiKey) {
    throw new Error("BREVO_API_KEY must be configured");
  }

  const html = `
    <div style="margin:0;padding:32px 16px;background:linear-gradient(180deg,#fffdf6 0%,#f8fafc 55%,#eef2ff 100%);font-family:'Segoe UI',Arial,sans-serif;color:#0f172a;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;margin:0 auto;border-spacing:0;">
        <tr>
          <td style="padding:0;">
            <div style="border-radius:24px;overflow:hidden;background:#ffffff;border:1px solid #e2e8f0;box-shadow:0 24px 60px -40px rgba(15,23,42,0.35);">
              <div style="padding:22px 26px;background:#0f172a;color:#f8fafc;">
                <p style="margin:0;font-size:11px;letter-spacing:0.24em;text-transform:uppercase;color:#fdba74;font-weight:700;">DistillLearn</p>
                <h1 style="margin:10px 0 0;font-size:24px;line-height:1.25;font-weight:700;color:#ffffff;">Confirm your email</h1>
              </div>

              <div style="padding:26px;">
                <p style="margin:0 0 10px;font-size:15px;line-height:1.6;color:#334155;">Hi ${username},</p>
                <p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:#334155;">Use this one-time password to complete your account verification.</p>

                <div style="margin:0 0 18px;padding:18px 16px;border:1px solid #fed7aa;border-radius:18px;background:#fff7ed;text-align:center;">
                  <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:#c2410c;font-weight:700;">Verification code</p>
                  <p style="margin:0;font-size:34px;line-height:1;letter-spacing:8px;font-weight:800;color:#0f172a;">${otp}</p>
                </div>

                <p style="margin:0 0 10px;font-size:14px;line-height:1.6;color:#475569;">This code expires in <strong style="color:#0f172a;">10 minutes</strong>.</p>
                <p style="margin:0;font-size:13px;line-height:1.6;color:#64748b;">If you did not create this account, you can safely ignore this email.</p>
              </div>

              <div style="padding:14px 26px;background:#f8fafc;border-top:1px solid #e2e8f0;">
                <p style="margin:0;font-size:12px;line-height:1.6;color:#64748b;">Sent by DistillLearn</p>
              </div>
            </div>
          </td>
        </tr>
      </table>
    </div>
  `;

  const text = [
    "DistillLearn - Confirm your email",
    "",
    `Hi ${username},`,
    "",
    "Use this one-time password to verify your email:",
    otp,
    "",
    "This code expires in 10 minutes.",
    "If you did not create this account, you can ignore this email.",
  ].join("\n");

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify({
      sender: {
        name: appName,
        email: fromEmail,
      },
      to: [
        {
          email: toEmail,
          name: username,
        },
      ],
      subject: "Verify your email - DistillLearn",
      htmlContent: html,
      textContent: text,
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Brevo API failed (${response.status}): ${message}`);
  }
};
