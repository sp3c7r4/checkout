import { db } from "../db";
import { payment } from "../db/schema";
import CheckoutEmitter from "../Event";
import { getBusinessById } from "../helpers/business";
import OrderRepository from "../repository/OrderRepository";
import PaymentRepository from "../repository/PaymentRepository";
import { generateReceipt } from "../utils/Reciept";
import { getAdminById } from "../helpers/admin";
import { OK } from "../utils/Response";
import PaymentResource from "../resource/payment";

export async function handlePaystackPayment(data: any, event: string) {
  // Destructure only the fields that match your payment schema
  try {
    const { id: paystack_transaction_id, reference, amount, currency, status, gateway_response, paid_at, channel, metadata, authorization, customer } = data;
    console.log({ id: paystack_transaction_id, reference, amount, currency, status, gateway_response, paid_at, channel, metadata, authorization, customer })
    const { order_id } = metadata
    if (!order_id) return; 
    const order = await OrderRepository.updateModel(order_id, { status: 'approved' });
    // Extract user_id from metadata and customer_id from customer object
    const user_id = order?.user_id;
    const business_id = order?.business_id;
    const customer_id = customer?.customer_code;
  
    const paymentData = {
      reference,
      paystack_transaction_id: paystack_transaction_id?.toString(),
      amount,
      currency,
      status,
      gateway_response,
      paid_at: paid_at ? new Date(paid_at) : null,
      customer_id,
      authorization: {
        authorization_code: authorization?.authorization_code,
        card_type: authorization?.card_type,
        last4: authorization?.last4,
        exp_month: authorization?.exp_month,
        exp_year: authorization?.exp_year,
        bin: authorization?.bin,
        bank: authorization?.bank,
        channel: authorization?.channel,
        signature: authorization?.signature,
        reusable: authorization?.reusable,
        country_code: authorization?.country_code,
      },
      channel,
      metadata,
      user_id: parseInt(user_id),
      business_id
    };
  
    const { name: business_name } = await getBusinessById(business_id);
  
    const payment = await PaymentRepository.create(paymentData);
    const sampleReceiptData = {
      currency: currency || "₦",
      amount: (amount / 100).toString(), // Convert from kobo to naira
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('en-US', { hour12: false }),
      status: status === 'success' ? 'success' : 'pending',
      business_name: business_name || 'Business Name',
      transaction_id: order.id,
      payment_id: payment.id,
      items: order.products || []
    };
  
    // await db.insert(payment).values(paymentData);
    return CheckoutEmitter.emit("sendReceipt", { 
      user_id,
      message: `Payment Successful for Order ID: ${order_id}`,
      data: '',
      imageBuffer: await generateReceipt(sampleReceiptData, 'image')
    });
  } catch(e) {
    return OK('OK', e.message);
  }
}

export async function getUserPayments(admin_id: string, business_id: string) {
  await Promise.all([getAdminById(admin_id), getBusinessById(business_id)]);
  const payments = await PaymentRepository.readPaymentsByBusinessId(business_id);
  return OK('Payments fetched successfully', payments.map(payment => PaymentResource(payment)))
}