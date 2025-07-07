export function AddressResource(model: any) {
  return {
    street: model.street,
    state: model.state,
    country: model.country
  }
} 

export default function BusinessResource(model: any) {
  return {
    id: model.id,
    name: model.name,
    email: model.email,
    address: model.address ? AddressResource(model.address) : undefined
  }
}
