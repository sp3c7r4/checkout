import { Input } from "telegraf";
import env from "./src/config/env";
import Checkout from "./src/utils/checkout-bot";
import { generateReceipt, generateReceiptPDFBuffer } from "./src/utils/Reciept";
import Paystack from "./src/utils/Paystack";
import OrderRepository from "./src/repository/OrderRepository";

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
console.log(await OrderRepository.updateModel('01K0EYGW6T004DEPG0HV3DN5WA', { status: 'approved' }))