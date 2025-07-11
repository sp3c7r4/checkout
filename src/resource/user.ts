export default function UserResource(model: any) {
  return {
    id: model.user_id,
    link_id: model.id,
    first_name: model.user.first_name,
    last_name: model.user.last_name,
    username: model.user.username,
  }
}