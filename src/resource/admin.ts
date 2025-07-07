export default function AdminResource(model: any) {
  return {
    id: model.id,
    first_name: model.first_name,
    last_name: model.last_name,
    email: model.email,
  }
}