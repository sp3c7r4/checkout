import { db } from "../db";
import { payment } from "../db/schema";

export async function handlePaystackPayment(data: any, event: string) {
  // Destructure only the fields that match your payment schema
  const { id: paystack_transaction_id, reference, amount, currency, status, gateway_response, paid_at, channel, metadata, authorization, customer } = data;

  // Extract user_id from metadata and customer_id from customer object
  const user_id = metadata?.user_id;
  const business_id = metadata?.business_id; // Add this to your metadata when creating the transaction
  const customer_id = customer?.customer_code;

  // You'll also need to determine the business_id based on your application logic
  // This might come from metadata or you might need to look it up

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

  await db.insert(payment).values(paymentData); // Assuming you have a db instance to interact with your database

  // Now you can save paymentData to your database
  // Example: await db.insert(payment).values(paymentData);
}