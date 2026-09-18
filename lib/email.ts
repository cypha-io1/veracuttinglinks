import { Resend } from 'resend';

let resendInstance: Resend | null = null;

function getResendInstance(): Resend | null {
  if (!process.env.RESEND_API_KEY) {
    return null;
  }

  if (!resendInstance) {
    resendInstance = new Resend(process.env.RESEND_API_KEY);
  }

  return resendInstance;
}

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'noreply@zhilakaii.com';
const EMAIL_SENDING_ENABLED = false;

export type EmailTemplate =
  | 'order_confirmation'
  | 'password_reset'
  | 'signup_welcome'
  | 'payment_confirmed'
  | 'admin_communication';

export async function sendEmail(options: {
  to: string;
  subject: string;
  template: EmailTemplate;
  data: Record<string, unknown>;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!EMAIL_SENDING_ENABLED) {
    console.warn(`[Email] Temporarily disabled. Skipped sending ${options.template} to ${options.to}`);
    return { success: false, error: 'Email sending is temporarily disabled' };
  }

  const resend = getResendInstance();

  if (!resend) {
    console.warn(`[Email] Skipped sending ${options.template} to ${options.to} (RESEND_API_KEY not set)`);
    return { success: false, error: 'Email service not configured' };
  }

  const html = buildEmailHtml(options.template, options.data);

  try {
    const response = await resend.emails.send({
      from: FROM_EMAIL,
      to: options.to,
      subject: options.subject,
      html,
    });

    if (response.error) {
      console.error(`[Email] Failed to send ${options.template}:`, response.error);
      return { success: false, error: response.error.message };
    }

    return { success: true, messageId: response.data?.id };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[Email] Exception sending ${options.template}:`, message);
    return { success: false, error: message };
  }
}

function buildEmailHtml(template: EmailTemplate, data: Record<string, unknown>): string {
  const containerStyle = `
    max-width: 600px;
    margin: 0 auto;
    padding: 20px;
    background: #f9fafb;
  `;

  const cardStyle = `
    background: white;
    padding: 30px;
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    margin-bottom: 20px;
  `;

  const buttonStyle = `
    display: inline-block;
    background: #f97316;
    color: white;
    padding: 12px 24px;
    border-radius: 6px;
    text-decoration: none;
    font-weight: 600;
    margin-top: 10px;
  `;

  const footerStyle = `
    text-align: center;
    color: #666;
    font-size: 12px;
    margin-top: 40px;
    padding-top: 20px;
    border-top: 1px solid #eee;
  `;

  switch (template) {
    case 'order_confirmation': {
      const { orderNumber, customerName, items, total, orderLink } = data as {
        orderNumber: string;
        customerName: string;
        items?: Array<{ name: string; qty: number; price: string }>;
        total: string;
        orderLink?: string;
      };

      const itemsHtml = Array.isArray(items)
        ? items.map(item => `<tr><td style="padding: 10px 0;">${item.name}</td><td style="padding: 10px 0; text-align: right;">Qty: ${item.qty}</td><td style="padding: 10px 0; text-align: right;">${item.price}</td></tr>`).join('')
        : '';

      return `
        <div style="${containerStyle}">
          <div style="${cardStyle}">
            <h1 style="margin: 0 0 20px 0; color: #1f2937;">Order Confirmed!</h1>
            <p>Hi ${customerName},</p>
            <p>Your order <strong>#${orderNumber}</strong> has been received and is being prepared.</p>
            
            ${itemsHtml ? `
              <table style="width: 100%; margin: 20px 0; border-top: 1px solid #eee;">
                ${itemsHtml}
              </table>
              <div style="text-align: right; padding-top: 10px; font-weight: 600; border-top: 1px solid #eee;">
                Total: <strong>${total}</strong>
              </div>
            ` : ''}
            
            <p style="margin-top: 20px;">You can track your order status at any time using your order number.</p>
            
            ${orderLink ? `<a href="${orderLink}" style="${buttonStyle}">View Order</a>` : ''}
            
            <p style="margin-top: 20px; color: #666; font-size: 14px;">Thank you for your order!</p>
          </div>
          <div style="${footerStyle}">
            <p>Zhilakaii © ${new Date().getFullYear()}</p>
            <p>support@zhilakaii.com</p>
          </div>
        </div>
      `;
    }

    case 'password_reset': {
      const { resetLink, customerName, code } = data as {
        resetLink?: string;
        customerName: string;
        code?: string;
      };

      return `
        <div style="${containerStyle}">
          <div style="${cardStyle}">
            <h1 style="margin: 0 0 20px 0; color: #1f2937;">Reset Your Password</h1>
            <p>Hi ${customerName},</p>
            <p>We received a request to reset your password. Click the button below to set a new password:</p>
            
            ${resetLink ? `<a href="${resetLink}" style="${buttonStyle}">Reset Password</a>` : ''}
            
            ${code ? `<p style="margin-top: 20px; background: #f3f4f6; padding: 15px; border-radius: 6px; font-family: 'Courier New', monospace; font-weight: 600; letter-spacing: 1px;">Code: ${code}</p>` : ''}
            
            <p style="margin-top: 20px; color: #666; font-size: 14px;">This link expires in 10 minutes. If you didn't request this, you can safely ignore this email.</p>
          </div>
          <div style="${footerStyle}">
            <p>Zhilakaii © ${new Date().getFullYear()}</p>
          </div>
        </div>
      `;
    }

    case 'signup_welcome': {
      const { customerName, loginLink } = data as {
        customerName: string;
        loginLink?: string;
      };

      return `
        <div style="${containerStyle}">
          <div style="${cardStyle}">
            <h1 style="margin: 0 0 20px 0; color: #1f2937;">Welcome to Zhilakaii!</h1>
            <p>Hi ${customerName},</p>
            <p>Your account has been created successfully. You're now ready to start browsing and ordering.</p>
            
            ${loginLink ? `<a href="${loginLink}" style="${buttonStyle}">Go to App</a>` : ''}
            
            <p style="margin-top: 20px;">If you have any questions, feel free to reach out to our support team.</p>
          </div>
          <div style="${footerStyle}">
            <p>Zhilakaii © ${new Date().getFullYear()}</p>
            <p>support@zhilakaii.com</p>
          </div>
        </div>
      `;
    }

    case 'payment_confirmed': {
      const { orderNumber, customerName, amount, paymentMethod } = data as {
        orderNumber: string;
        customerName: string;
        amount: string;
        paymentMethod?: string;
      };

      return `
        <div style="${containerStyle}">
          <div style="${cardStyle}">
            <h1 style="margin: 0 0 20px 0; color: #16a34a;">Payment Confirmed!</h1>
            <p>Hi ${customerName},</p>
            <p>Your payment for order <strong>#${orderNumber}</strong> has been confirmed.</p>
            
            <div style="background: #f0fdf4; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <p style="margin: 0; color: #166534;"><strong>Amount: ${amount}</strong></p>
              ${paymentMethod ? `<p style="margin: 5px 0 0 0; color: #166534; font-size: 14px;">Method: ${paymentMethod}</p>` : ''}
            </div>
            
            <p style="margin-top: 20px;">Your order will be prepared and delivered soon.</p>
          </div>
          <div style="${footerStyle}">
            <p>Zhilakaii © ${new Date().getFullYear()}</p>
          </div>
        </div>
      `;
    }

    case 'admin_communication': {
      const { customerName, message, subject } = data as {
        customerName?: string;
        message: string;
        subject?: string;
      };

      return `
        <div style="${containerStyle}">
          <div style="${cardStyle}">
            <h1 style="margin: 0 0 20px 0; color: #1f2937;">${subject || 'Zhilakaii Update'}</h1>
            ${customerName ? `<p>Hi ${customerName},</p>` : ''}
            <p style="white-space: pre-wrap; line-height: 1.6; color: #334155;">${message}</p>
            <p style="margin-top: 20px; color: #64748b; font-size: 14px;">Zhilakaii Team</p>
          </div>
          <div style="${footerStyle}">
            <p>Zhilakaii © ${new Date().getFullYear()}</p>
            <p>support@zhilakaii.com</p>
          </div>
        </div>
      `;
    }

    default:
      return `<p>Email template not found</p>`;
  }
}
