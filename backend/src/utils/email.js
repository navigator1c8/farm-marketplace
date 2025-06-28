import nodemailer from 'nodemailer';

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Email templates
const templates = {
  verification: (data) => ({
    subject: 'Подтверждение регистрации - ФермаМаркет',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #22C55E;">Добро пожаловать в ФермаМаркет!</h2>
        <p>Здравствуйте, ${data.firstName}!</p>
        <p>Спасибо за регистрацию в ФермаМаркет. Для завершения регистрации, пожалуйста, подтвердите ваш email адрес.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${data.verificationUrl}" 
             style="background-color: #22C55E; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Подтвердить Email
          </a>
        </div>
        <p>Если кнопка не работает, скопируйте и вставьте эту ссылку в браузер:</p>
        <p style="word-break: break-all; color: #666;">${data.verificationUrl}</p>
        <p>С уважением,<br>Команда ФермаМаркет</p>
      </div>
    `
  }),

  resetPassword: (data) => ({
    subject: 'Сброс пароля - ФермаМаркет',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #22C55E;">Сброс пароля</h2>
        <p>Здравствуйте, ${data.firstName}!</p>
        <p>Вы запросили сброс пароля для вашего аккаунта в ФермаМаркет.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${data.resetUrl}" 
             style="background-color: #22C55E; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Сбросить пароль
          </a>
        </div>
        <p>Если кнопка не работает, скопируйте и вставьте эту ссылку в браузер:</p>
        <p style="word-break: break-all; color: #666;">${data.resetUrl}</p>
        <p><strong>Внимание:</strong> Ссылка действительна в течение 10 минут.</p>
        <p>Если вы не запрашивали сброс пароля, просто проигнорируйте это письмо.</p>
        <p>С уважением,<br>Команда ФермаМаркет</p>
      </div>
    `
  }),

  orderConfirmation: (data) => ({
    subject: `Подтверждение заказа #${data.orderNumber} - ФермаМаркет`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #22C55E;">Заказ подтвержден!</h2>
        <p>Здравствуйте, ${data.customerName}!</p>
        <p>Ваш заказ #${data.orderNumber} успешно оформлен и принят в обработку.</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Детали заказа:</h3>
          <p><strong>Номер заказа:</strong> ${data.orderNumber}</p>
          <p><strong>Дата доставки:</strong> ${data.deliveryDate}</p>
          <p><strong>Сумма заказа:</strong> ${data.total} ₽</p>
        </div>

        <p>Мы свяжемся с вами для уточнения деталей доставки.</p>
        <p>С уважением,<br>Команда ФермаМаркет</p>
      </div>
    `
  })
};

// Send email function
export const sendEmail = async ({ to, template, data }) => {
  try {
    const transporter = createTransporter();
    
    const emailTemplate = templates[template](data);
    
    const mailOptions = {
      from: `"ФермаМаркет" <${process.env.EMAIL_USER}>`,
      to,
      subject: emailTemplate.subject,
      html: emailTemplate.html
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Email отправлен:', result.messageId);
    
    return result;

  } catch (error) {
    console.error('Ошибка отправки email:', error);
    throw error;
  }
};

export default { sendEmail };