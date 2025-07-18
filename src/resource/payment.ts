export default function PaymentResource(model: any) {
  return {
    id: model.id,
    reference: model.reference,
    status: model.status,
    amount: model.amount,
    gateway_response: model.gateway_response,
    paid_at: model.paid_at,
    email: model.user.email,
    phone: model.user.phone,
    order_id: model.metadata.order_id,
    currency: model.currency
  }
}