export default function OrderResource(model: any) {
  return {
    id: model.id,
    products: model.products,
    total_price: model.total_price,
    status: model.status,
    user_id: model.user_id,
    first_name: model.user.first_name,
    last_name: model.user.last_name,
    email: model.user.email,
  }
}