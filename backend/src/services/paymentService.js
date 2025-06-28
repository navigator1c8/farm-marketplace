import Stripe from 'stripe';
import Payment from '../models/Payment.js';
import Order from '../models/Order.js';
import notificationService from './notificationService.js';

class PaymentService {
  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }

  async createPaymentIntent(orderId, amount, currency = 'rub') {
    try {
      const order = await Order.findById(orderId).populate('customer');
      if (!order) {
        throw new Error('Order not found');
      }

      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to kopecks
        currency,
        metadata: {
          orderId: orderId.toString(),
          customerEmail: order.customer.email
        },
        automatic_payment_methods: {
          enabled: true
        }
      });

      // Create payment record
      const payment = await Payment.create({
        order: orderId,
        amount,
        currency: currency.toUpperCase(),
        method: 'card',
        provider: 'stripe',
        transactionId: paymentIntent.id,
        status: 'pending',
        description: `Оплата заказа ${order.orderNumber}`
      });

      return {
        clientSecret: paymentIntent.client_secret,
        paymentId: payment._id
      };

    } catch (error) {
      console.error('Create payment intent error:', error);
      throw error;
    }
  }

  async handleWebhook(signature, payload) {
    try {
      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );

      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentSuccess(event.data.object);
          break;
        
        case 'payment_intent.payment_failed':
          await this.handlePaymentFailure(event.data.object);
          break;
        
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      return { received: true };

    } catch (error) {
      console.error('Webhook handling error:', error);
      throw error;
    }
  }

  async handlePaymentSuccess(paymentIntent) {
    try {
      const orderId = paymentIntent.metadata.orderId;
      
      // Update payment status
      await Payment.findOneAndUpdate(
        { transactionId: paymentIntent.id },
        {
          status: 'succeeded',
          processedAt: new Date(),
          metadata: {
            ...paymentIntent.metadata,
            receiptUrl: paymentIntent.charges?.data[0]?.receipt_url
          }
        }
      );

      // Update order status
      const order = await Order.findByIdAndUpdate(
        orderId,
        {
          'payment.status': 'paid',
          'payment.paidAt': new Date(),
          status: 'confirmed'
        },
        { new: true }
      ).populate('customer');

      // Send notification
      if (order) {
        await notificationService.sendNotification(
          order.customer._id,
          notificationService.templates.paymentReceived({
            amount: paymentIntent.amount / 100,
            orderId,
            orderNumber: order.orderNumber
          }),
          { sendEmail: true }
        );
      }

    } catch (error) {
      console.error('Handle payment success error:', error);
    }
  }

  async handlePaymentFailure(paymentIntent) {
    try {
      const orderId = paymentIntent.metadata.orderId;
      
      // Update payment status
      await Payment.findOneAndUpdate(
        { transactionId: paymentIntent.id },
        {
          status: 'failed',
          failedAt: new Date(),
          metadata: {
            ...paymentIntent.metadata,
            failureReason: paymentIntent.last_payment_error?.message
          }
        }
      );

      // Update order status
      const order = await Order.findByIdAndUpdate(
        orderId,
        { 'payment.status': 'failed' },
        { new: true }
      ).populate('customer');

      // Send notification
      if (order) {
        await notificationService.sendNotification(
          order.customer._id,
          {
            type: 'payment_failed',
            title: 'Ошибка оплаты',
            message: `Не удалось обработать платеж для заказа #${order.orderNumber}. Попробуйте еще раз.`,
            data: { orderId, orderNumber: order.orderNumber },
            priority: 'high'
          },
          { sendEmail: true }
        );
      }

    } catch (error) {
      console.error('Handle payment failure error:', error);
    }
  }

  async processRefund(paymentId, amount, reason) {
    try {
      const payment = await Payment.findById(paymentId);
      if (!payment) {
        throw new Error('Payment not found');
      }

      const refund = await this.stripe.refunds.create({
        payment_intent: payment.transactionId,
        amount: amount ? Math.round(amount * 100) : undefined,
        reason: 'requested_by_customer',
        metadata: { reason }
      });

      // Update payment record
      payment.refunds.push({
        amount: refund.amount / 100,
        reason,
        refundId: refund.id,
        processedAt: new Date(),
        status: 'succeeded'
      });

      const totalRefunded = payment.refunds.reduce(
        (sum, refund) => sum + refund.amount, 0
      );

      if (totalRefunded >= payment.amount) {
        payment.status = 'refunded';
      } else {
        payment.status = 'partially_refunded';
      }

      await payment.save();

      return refund;

    } catch (error) {
      console.error('Process refund error:', error);
      throw error;
    }
  }

  async getPaymentMethods(customerId) {
    try {
      const paymentMethods = await this.stripe.paymentMethods.list({
        customer: customerId,
        type: 'card'
      });

      return paymentMethods.data;

    } catch (error) {
      console.error('Get payment methods error:', error);
      throw error;
    }
  }

  async createCustomer(userData) {
    try {
      const customer = await this.stripe.customers.create({
        email: userData.email,
        name: `${userData.firstName} ${userData.lastName}`,
        phone: userData.phone,
        metadata: {
          userId: userData.userId.toString()
        }
      });

      return customer;

    } catch (error) {
      console.error('Create customer error:', error);
      throw error;
    }
  }
}

export default new PaymentService();