import { Input } from "telegraf";
import env from "./src/config/env";
import Checkout from "./src/utils/checkout-bot";
import { generateReceipt, generateReceiptPDFBuffer } from "./src/utils/Reciept";
import Paystack from "./src/utils/Paystack";
import OrderRepository from "./src/repository/OrderRepository";
import ProductRepository from "./src/repository/ProductRepository";
import { getSmartRecommendations } from "./src/helpers/bot";

// const sampleReceiptData = {
//   currency: "₦",
//   amount: "125000",
//   date: "2025-07-17",
//   time: "14:30",
//   status: 'success', // 'success', 'pending', 'declined'
//   business_name: 'Spectra Electronics',
//   transaction_id: '01K09KMV69M11MCFFVDJXBY424',
//   payment_id: '01K09KRT9H7H17HGVN7G1NZ3MX',
//   items: [
//     {
//       "id": "01K0849KJPQYG6HHHK30YZ1CT0",
//       "name": "Hennessy Cognac",
//       "price": "25000",
//       "quantity": 5
//     }
//   ]
// };
// // console.time("Buffer Generated")
// // const buffer = await generateReceiptPDFBuffer(sampleReceiptData);
// // console.timeEnd("Buffer Generated")

// const checkoutBot = new Checkout(env.TELEGRAM_BOT_TOKEN)
// // Send receipt as PDF document
// const imageBuffer = await generateReceipt(sampleReceiptData, 'image');
// // const inputFile = Input.fromBuffer(pdfBuffer, `receipt_${sampleReceiptData.transaction_id}.png`);
// await checkoutBot.sendMessageDocument(6178017781, `Reciept-${sampleReceiptData.date}-${sampleReceiptData.time}`,'', imageBuffer);
// console.log(await Paystack.initializePayment(100000, 'sarafasatar@gmail.com'))
// console.log(await OrderRepository.updateModel('01K0EYGW6T004DEPG0HV3DN5WA', { status: 'approved' }))
// console.log(await ProductRepository.readProductByBusinessIdAndProductNameNext('01K0HGMGGWQV48AFBY1Z67Q141', 'Iphone'))
const cartItems = [
  {
    id: "01K0849KJPQYG6HHHK30YZ1CT0",
    name: "Hennessy Cognac",
    price: "25000",
    quantity: 5
  },
  {
    id: "01K0849KJPQYG6HHHK30YZ1CT1",
    name: "iPhone 15 Pro",
    price: "450000",
    quantity: 2
  },
  {
    id: "01K0849KJPQYG6HHHK30YZ1CT2",
    name: "Samsung Galaxy S24",
    price: "380000",
    quantity: 1
  },
  {
    id: "01K0849KJPQYG6HHHK30YZ1CT3",
    name: "MacBook Air M2",
    price: "850000",
    quantity: 1
  },
  {
    id: "01K0849KJPQYG6HHHK30YZ1CT4",
    name: "Nike Air Jordan",
    price: "75000",
    quantity: 3
  },
  {
    id: "01K0849KJPQYG6HHHK30YZ1CT5",
    name: "Sony WH-1000XM5 Headphones",
    price: "120000",
    quantity: 1
  }
];

const existingStoreProducts = [
  {
    id: "01K0849KJPQYG6HHHK30YZ1CT6",
    name: "AirPods Pro",
    price: "95000",
    quantity: 2
  },
  {
    id: "01K0849KJPQYG6HHHK30YZ1CT7",
    name: "Dell XPS 13 Laptop",
    price: "720000",
    quantity: 1
  },
  {
    id: "01K0849KJPQYG6HHHK30YZ1CT8",
    name: "iPad Pro 12.9",
    price: "550000",
    quantity: 3
  },
  {
    id: "01K0849KJPQYG6HHHK30YZ1CT9",
    name: "Canon EOS R5 Camera",
    price: "1200000",
    quantity: 1
  },
  {
    id: "01K0849KJPQYG6HHHK30YZ1CTA",
    name: "Adidas Ultraboost 22",
    price: "65000",
    quantity: 4
  }
];

await getSmartRecommendations(cartItems, existingStoreProducts, '01K0849KJPQYG6HHHK30YZ1CT0', 5)