import nodemailer from 'nodemailer';
import { cache } from '../config/redis.js';

class EmailService {
  constructor() {
    this.transporter = this.createTransporter();
    this.templates = this.loadTemplates();
  }

  createTransporter() {
    return nodemailer.createTransporter({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      pool: true,
      maxConnections: 5,
      maxMessages: 100
    });
  }

  loadTemplates() {
    return {
      welcome: {
        subject: 'Добро пожаловать в ФермаМаркет!',
        html: (data) => `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #22C55E, #16A34A); padding: 40px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Добро пожаловать!</h1>
            </div>
            <div style="padding: 40px; background: #f9f9f9;">
              <h2 style="color: #22C55E;">Здравствуйте, ${data.firstName}!</h2>
              <p style="font-size: 16px; line-height: 1.6;">
                Спасибо за регистрацию в ФермаМаркет! Теперь у вас есть доступ к свежим продуктам 
                от лучших фермеров вашего региона.
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${data.verificationUrl}" 
                   style="background-color: #22C55E; color: white; padding: 15px 30px; 
                          text-decoration: none; border-radius: 8px; display: inline-block; 
                          font-weight: bold;">
                  Подтвердить Email
                </a>
              </div>
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #16A34A;">Что вас ждет:</h3>
                <ul style="list-style: none; padding: 0;">
                  <li style="padding: 8px 0;">🥕 Свежие органические продукты</li>
                  <li style="padding: 8px 0;">🚚 Быстрая доставка</li>
                  <li style="padding: 8px 0;">👨‍🌾 Прямая связь с фермерами</li>
                  <li style="padding: 8px 0;">💰 Выгодные цены</li>
                </ul>
              </div>
            </div>
          </div>
        `
      },

      orderConfirmation: {
        subject: (data) => `Заказ #${data.orderNumber} подтвержден`,
        html: (data) => `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #22C55E; padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0;">Заказ подтвержден!</h1>
            </div>
            <div style="padding: 30px;">
              <h2>Здравствуйте, ${data.customerName}!</h2>
              <p>Ваш заказ #${data.orderNumber} успешно оформлен и принят в обработку.</p>
              
              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3>Детали заказа:</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Номер заказа:</strong></td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${data.orderNumber}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Дата доставки:</strong></td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${data.deliveryDate}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0;"><strong>Сумма заказа:</strong></td>
                    <td style="padding: 8px 0; font-size: 18px; font-weight: bold; color: #22C55E;">${data.total} ₽</td>
                  </tr>
                </table>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${data.trackingUrl}" 
                   style="background-color: #22C55E; color: white; padding: 12px 24px; 
                          text-decoration: none; border-radius: 6px; display: inline-block;">
                  Отследить заказ
                </a>
              </div>
            </div>
          </div>
        `
      },

      passwordReset: {
        subject: 'Сброс пароля - ФермаМаркет',
        html: (data) => `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #f59e0b; padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0;">Сброс пароля</h1>
            </div>
            <div style="padding: 30px;">
              <h2>Здравствуйте, ${data.firstName}!</h2>
              <p>Вы запросили сброс пароля для вашего аккаунта в ФермаМаркет.</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${data.resetUrl}" 
                   style="background-color: #f59e0b; color: white; padding: 15px 30px; 
                          text-decoration: none; border-radius: 8px; display: inline-block; 
                          font-weight: bold;">
                  Сбросить пароль
                </a>
              </div>
              
              <div style="background: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b;">
                <p style="margin: 0;"><strong>Внимание:</strong> Ссылка действительна в течение 10 минут.</p>
              </div>
              
              <p style="margin-top: 20px;">
                Если вы не запрашивали сброс пароля, просто проигнорируйте это письмо.
              </p>
            </div>
          </div>
        `
      },

      promotionalOffer: {
        subject: (data) => `🎉 ${data.offerTitle} - Специально для вас!`,
        html: (data) => `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #f59e0b, #d97706); padding: 40px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 32px;">🎉 ${data.offerTitle}</h1>
              <p style="color: white; font-size: 18px; margin: 10px 0 0 0;">${data.subtitle}</p>
            </div>
            <div style="padding: 40px;">
              <h2 style="color: #d97706;">Здравствуйте, ${data.firstName}!</h2>
              <p style="font-size: 16px; line-height: 1.6;">${data.description}</p>
              
              <div style="background: #fef3c7; padding: 30px; border-radius: 12px; text-align: center; margin: 30px 0;">
                <h3 style="color: #92400e; margin: 0 0 15px 0;">Промокод:</h3>
                <div style="background: white; padding: 15px; border-radius: 8px; border: 2px dashed #f59e0b;">
                  <span style="font-size: 24px; font-weight: bold; color: #d97706; letter-spacing: 2px;">
                    ${data.promoCode}
                  </span>
                </div>
                <p style="margin: 15px 0 0 0; color: #92400e;">Скидка ${data.discount}%</p>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${data.shopUrl}" 
                   style="background-color: #f59e0b; color: white; padding: 15px 30px; 
                          text-decoration: none; border-radius: 8px; display: inline-block; 
                          font-weight: bold; font-size: 16px;">
                  Начать покупки
                </a>
              </div>
              
              <p style="font-size: 14px; color: #6b7280; text-align: center;">
                Предложение действительно до ${data.expiryDate}
              </p>
            </div>
          </div>
        `
      }
    };
  }

  async sendEmail(to, templateName, data, options = {}) {
    try {
      // Check rate limiting
      const rateLimitKey = `email_rate_limit:${to}`;
      const emailCount = await cache.get(rateLimitKey) || 0;
      
      if (emailCount >= 10) { // Max 10 emails per hour
        throw new Error('Email rate limit exceeded');
      }

      const template = this.templates[templateName];
      if (!template) {
        throw new Error(`Template ${templateName} not found`);
      }

      const subject = typeof template.subject === 'function' 
        ? template.subject(data) 
        : template.subject;

      const html = template.html(data);

      const mailOptions = {
        from: `"ФермаМаркет" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
        to,
        subject,
        html,
        ...options
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      // Update rate limiting
      await cache.set(rateLimitKey, emailCount + 1, 3600);
      
      console.log(`📧 Email sent to ${to}: ${result.messageId}`);
      return result;

    } catch (error) {
      console.error('Email sending error:', error);
      throw error;
    }
  }

  async sendBulkEmails(recipients, templateName, dataGenerator, options = {}) {
    const results = [];
    const batchSize = 10;
    
    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (recipient) => {
        try {
          const data = typeof dataGenerator === 'function' 
            ? dataGenerator(recipient) 
            : dataGenerator;
          
          return await this.sendEmail(recipient.email, templateName, data, options);
        } catch (error) {
          console.error(`Failed to send email to ${recipient.email}:`, error);
          return { error: error.message, recipient: recipient.email };
        }
      });
      
      const batchResults = await Promise.allSettled(batchPromises);
      results.push(...batchResults);
      
      // Wait between batches to avoid overwhelming the SMTP server
      if (i + batchSize < recipients.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return results;
  }

  async verifyConnection() {
    try {
      await this.transporter.verify();
      console.log('✅ Email service connection verified');
      return true;
    } catch (error) {
      console.error('❌ Email service connection failed:', error);
      return false;
    }
  }
}

export default new EmailService();