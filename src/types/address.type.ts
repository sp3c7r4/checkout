export type Address = {
  id: string;
  street: string;
  state: string;
  country: string;
  business_id: string; // Reference to the business this address belongs to
}