// import { db } from "./src/db";
// import { getUserById } from "./src/helpers/user";
import { db } from "./src/db";
import { MarkDownizeProducts, MutateProduct } from "./src/helpers/bot";
// import { checkoutBot } from "./src/mastra";
import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { checkoutAgent } from "./src/mastra/agents";
import ProductRepository from "./src/repository/ProductRepository";
import cloudinary from "./src/utils/cloudinary";
import Paystack from "./src/utils/Paystack";
import CartRepository from "./src/repository/CartRepository";
import nodemailer from 'nodemailer';
import env from "./src/config/env";


// Configure nodemailer transporter
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // Use STARTTLS
  auth: {
    user: env.CHECKOUT_MAIL || 'your-email@gmail.com',
    pass: env.CHECKOUT_MAIL_PASSWORD || 'your-app-password'
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Test email function
async function sendTestEmail() {
  try {
    const mailOptions = {
      from: env.CHECKOUT_MAIL || 'your-email@gmail.com',
      to: 'sarafasatar@gmail.com',
      subject: 'Test Email',
      html: `
        <h2>Test Email</h2>
        <p>This is a test email sent from your application.</p>
        <p>Sent at: ${new Date().toLocaleString()}</p>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

// Send the test email
sendTestEmail();

// const cart = await CartRepository.readCartByUserAndBusiness('6178017781', "01K06A6FZXV205X5GA5H3AX2QD");
// console.log(JSON.stringify(await Paystack.initializePayment(10000, "sarafasatar@gmail.com", { user_id: 6178017781, business_id: '01K06A6FZXV205X5GA5H3AX2QD', product: cart.products })));

// console.log(await ProductRepository.readProductByBusinessIdAndProductName("01K0842543WV2PXBDQDBHSKCZ1", 'hennesy'))
// c
// console.log(await ProductRepository.readProductsByBusinessIdAndBarcode('01K06A6FZXV205X5GA5H3AX2QD', '12345'))
// import { checkProductTool } from "./src/mastra/tools";
// import AdminRepository from "./src/repository/AdminRepository";
// import BusinessRepository from "./src/repository/BusinessRepository";
// import CartRepository from "./src/repository/CartRepository";
// import ProductRepository from "./src/repository/ProductRepository";
// import UserRepository from "./src/repository/UserRepository";
// import { ulid } from "ulid";
// //   await AdminRepository.create({
//     first_name: 'spectra',
//     last_name: 'gee',
//     email: 'spectra@gmail.com',
//     password: "Djlacoco24"
//   })
// )
// const product = [
//   {
//     name: "Sample Product",
//     price: 1500,
//     quantity: 20,
//     id: "01DUMMYPRODUCTID",
//     description: "This is a sample product for testing.",
//     image: "https://example.com/sample-product.jpg",
//   },
// ];
// const index = 0;

// <b>Bold</b> -> &lt;b&gt;Bold&lt;/b&gt;<br>
// <i>Italic</i> -> &lt;i&gt;Italic&lt;/i&gt;<br>
// <a href="https://example.com">Link</a> -> &lt;a href="..."&gt;Link&lt;/a&gt;<br>
// <code>Inline code</code> -> &lt;code&gt;Inline code&lt;/code&gt;<br>
// <blockquote>Blockquote</blockquote>
// &lt;br&gt; (new line) for line breaks<br><br>
// <b>Example:</b><br>
// <b>Product:</b> <i>Laptop</i><br>
// <b>Price:</b> <code>$1000</code><br>
// <a href="https://example.com">View Product</a>

//
// //   where: (u, { eq }) => eq(u.id, 6178017781),
// }));

// // const prods = [{
//         "quantity": 10,
//         "price": 300,
//         "id": "01JZG4QV166R0JBMN05V4QTFTP"
//     }, {
//         "id": "01JZG36A1Z2BXYBGX88773BBGM",
//         "price": 300,
//         "quantity": 5
//     }]
// // // //
// First, define the table in your schema file
// Then import and use it
// try {
//   // Check if table exists
//   const tableExists = await db.execute(sql`
//     SELECT EXISTS (
//       SELECT FROM information_schema.tables 
//       WHERE table_schema = 'storage' 
//       AND table_name = 'mastra_messages'
//       );
//       `);
  
//   console.log('Table exists:', tableExists);
  
//   if (tableExists[0].exists) {
//     const result = await db.execute(sql`SELECT * FROM mastra_messages`);
//     console.log('Messages:', result);
//   } else {
//     console.log('mastra_messages table does not exist');
//   }
// } catch (error) {
//   console.error('Error:', error);
// }
// console.log(await db.execute(sql`DELETE FROM storage.mastra_messages WHERE thread_id = 'telegram-01JZN6NJBVD7HMCYZ4JKHRSG3J-6178017781'`));
// console.log(await db.execute(sql`
//   WITH to_delete AS (
//     SELECT id FROM storage.mastra_messages
//     ORDER BY createdAt
//     OFFSET 2 LIMIT 1
//   )
//   DELETE FROM storage.mastra_messages
//   WHERE id IN (SELECT id FROM to_delete);
//   `));
// console.log(await db.execute(sql`
//   WITH to_delete AS (
//     SELECT id FROM storage.mastra_messages
//     ORDER BY "createdAt"
//     OFFSET 2 LIMIT 1
//   )
//   DELETE FROM storage.mastra_messages
//   WHERE id IN (SELECT id FROM to_delete);
//   `));
// const tables = await db.execute(sql`
//   SELECT table_name 
//   FROM information_schema.tables 
//   WHERE table_schema = 'public'
//   ORDER BY table_name;
// `);

// console.log('Available tables:');
// tables.forEach(table => console.log('-', table.table_name));

// const mastraTables = await db.execute(sql`
//   SELECT table_name 
//   FROM information_schema.tables 
//   WHERE table_schema = 'public'
//   AND table_name LIKE 'mastra%'
//   ORDER BY table_name;
// `);

// console.log('Mastra tables:');
// mastraTables.forEach(table => console.log('-', table.table_name));
// If it's the empty content error, try with a fresh thread
// if (error.message?.includes('contents.parts must not be empty')) {
//   console.log('Clearing problematic memory thread...');
//   try {
//     const { message } = error;
//     const index = (message.match(/contents\[(\d+)\]/) || [])[1];
//     const newThreadId = `telegram-${current_business_id || 'default'}-${userId}`;
//     const response = await checkoutAgent.generate(text, {
//       threadId: newThreadId,
//       resourceId: userId,
//       context: [
//         {
//           role: 'system',
//           content: `Current user: ${firstName} (${username}) | business_id: ${current_business_id || 'none'} | user_id: ${userId}`,
//         },
//       ],
//     });
    
//     if (this.BotSendMessageState) await ctx.reply(this.escapeMarkdown(response.text), { parse_mode: 'MarkdownV2' });
//   } catch (err) {
//     throw err
//   }
// }
// const products = [
//   {
//     name: "Sample Product",
//     price: 1500,
//     quantity: 20,
//     id: "01DUMMYPRODUCTID",
//     description: "This is a sample product for testing.",
//     image: "https://example.com/sample-product.jpg",
//   },
// ];

// console.log(await checkoutBot.sendMessageImage(6178017781, "Check out this product!", MutateProduct(products[0]), 'available.png'))