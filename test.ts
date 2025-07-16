// import { db } from "./src/db";
// import { getUserById } from "./src/helpers/user";
import { db } from "./src/db";
import { MarkDownizeProducts, MutateProduct } from "./src/helpers/bot";
import { checkoutBot } from "./src/mastra";
import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { checkoutAgent } from "./src/mastra/agents";
import ProductRepository from "./src/repository/ProductRepository";
import cloudinary from "./src/utils/cloudinary";
import Paystack from "./src/utils/Paystack";
import CartRepository from "./src/repository/CartRepository";

const cart = await CartRepository.readCartByUserAndBusiness('6178017781', "01K06A6FZXV205X5GA5H3AX2QD");
console.log(JSON.stringify(await Paystack.initializePayment(10000, "sarafasatar@gmail.com", { user_id: 6178017781, business_id: '01K06A6FZXV205X5GA5H3AX2QD', product: cart.products })));

// console.log(await ProductRepository.readProductByBusinessIdAndProductName("01K0842543WV2PXBDQDBHSKCZ1", 'hennesy'))
// console.log(await cloudinary.upload_image(`data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAx0AAAMdCAYAAAD+mRuTAAAACXBIWXMAAAsSAAALEgHS3X78AAAgAElEQVR4nO3dD5SdZX0n8Ocm4W+EmSgqsgsz/NFWC84AWq1QZgLWdnUlQdvTo2tJwJ7Tdm0Bbbtae44huG3Xs1tIaHdrz54lCXar7emRhFZ3t61hhmpra4UMAlotkECrEVBngIRA/tw9z3tnwoRMkpl773Pff5/POe8ZoBXufd6bee/3+T2/52mExrLhEEJ/AAAA6L5tMXSMhRBGDC4AAJDA8kVGFQAASEnoAAAAkhI6AACApIQOAAAgKaEDAABISugAAACSEjoAAICkhA4AACApoQMAAEhK6AAAAJISOgAAgKSEDgAAICmhAwAASEroAAAAkhI6AACApIQOAAAgKaEDAABISugAAACSEjoAAICkhA4AACApoQMAAEhK6AAAAJISOgAAgKSEDgAAICmhAwAASEroAAAAkhI6AACApIQOAAAgKaEDAABISugAAACSEjoAAICkhA4AACApoQMAAEhK6AAAAJISOgAAgKSEDgAAICmhAwAASEroAAAAkhI6AACApIQOAAAgKaEDAABISugAAACSEjoAAICkhA4AACApoQMAAEhK6AAAAJISOgAAgKSEDgAAICmhAwAASEroAAAAkhI6AACApIQOAAAgKaEDAABISugAAACSEjoAAICkhA4AACApoQMAAEhK6AAAAJISOgAAgKSEDgAAICmhAwAASEroAAAAkhI6AACApIQOAAAgKaEDAABISugAAACSEjoAAICkhA4AACApoQMAAEhK6AAAAJISOgAAgKSEDgAAICmhAwAASEroAAAAkhI6AACApIQOAAAgKaEDAABISugAAACSEjoAAICkhA4AACApoQMAAEhK6AAAAJISOgAAgKSEDgAAICmhAwAASEroAAAAkhI6AACApIQOAAAgKaEDAABISugAAACSEjoAAICkhA4AACApoQMAAEhK6AAAAJISOgAAgKSEDgAAICmhAwAASEroAAAAkhI6AACApIQOAAAgKaEDAABISugAAACSEjoAAICkhA4AACApoQMAAEhK6AAAAJISOgAAgKSEDgAAICmhAwAASEroAAAAkhI6AACApIQOAAAgKaEDAABISugAAACSEjoAAICkhA4AACApoQMAAEhK6AAAAJIS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JCV0AAAASQkdAABAUkIHAACQlNABAAAkJXQAAABJCR0AAEBSQgcAAJCU0AEAACQldAAAAEkJHQAAQFJCBwAAkJTQAQAAJCV0AAAASQkdAABAUkIHAACQlNABAAAkJXQAAABJCR0AAEBSQgcAAJCU0AEAACQldAAAAEkJHQAAQFJCBwAAkJTQAQAAJCV0AAAASQkdAABAUkIHAACQlNABAAAkJXQAAABJCR0AAEBSQgcAAJCU0AEAACQldAAAAEkJHQAAQFJCBwAAkJTQAQAAJCV0AAAASQkdAABAUkIHAACQlNABAAAkJXQAAABJCR0AAEBSQgcAAJCU0AEAACQldAAAAEkJHQAAQFJCBwAAkJTQAQAAJCV0AAAASQkdAABAUkIHAACQlNABAAAkJXQAAABJCR0AAEBSQgcAAJCU0AEAACQldAAAAEkJHQAAQFJCBwAAkJTQAQAAJCV0AAAASQkdAABAUkIHAACQlNABAAAkJXQAAABJCR0AAEBSQgcAAJCU0AEAACQldAAAAEkJHQAAQFJCBwAAkJTQAQAAJCV0AAAASQkdAABAUkIHAACQlNABAAAkJXQAAABJCR0AAEBSQgcAAJCU0AEAACQldAAAAEkJHQAAQFJCBwAAkJTQAQAAJCV0AAAASQkdAABAUkIHAACQlNABAAAkJXQAAABJCR0AAEBSQgcAAJCU0AEAACQldAAAAEkJHQAAQFJCBwAAkJTQAQAAJCV0AAAASQkdAABAUkIHAACQlNABAAAkJXQAAABJCR0AAEBSQgcAAJCU0AEAACQldAAAAEkJHQAAQFJCBwAAkJTQAQAAJCV0AAAASQkdAABAUkIHAACQlNABAAAkJXQAAABJCR0AAEBSQgcAAJCU0AEAACQldAAAAEkJHQAAQFJCBwAAkJTQAQAAJCV0AAAASQkdAABAUkIHAACQlNABAAAkJXQAAABJCR0AAEBSQgcAAJCU0AEAACQldAAAAEkJHQAAQFJCBwAAkJTQAQAAJCV0AAAASQkdAABAUkIHAACQlNABAAAkJXQAAABJCR0AAEBSQgcAAJCU0AEAACQldAAAAEkJHQAAQFJCBwAAkJTQAQAAJCV0AAAASQkdAABAUkIHAACQlNABAAAkJXQAAABJCR0AAEBSQgcAAJCU0AEAACQldAAAAEkJHQAAQFJCBwAAkJTQAQAAJCV0AAAASQkdAABAUkIHAACQlNABAAAkJXQAAABJCR0AAEBSQgcAAJCU0AEAACQldAAAAEkJHQAAQFJCBwAAkJTQAQAAJCV0AAAASQkdAABAUkIHAACQlNABAAAkJXQAAABJCR0AAEBSQgcAAJCU0AEAACQldAAAAEkJHQAAQFJCBwAAkJTQAQAAJCV0AAAASQkdAABAUkIHAACQlNABAAAkJXQAAABJCR0AAEBSQgcAAJCU0AEAACQldAAAAEkJHQAAQFJCBwAAkJTQAQAAJCV0AAAASQkdAABAUkIHAACQlNABAAAkJXQAAABJCR0AAEBSQgcAAJCU0AEAACQldAAAAEkJHQAAQFJCBwAAkJTQAQAAJCV0AAAASS0JIWwzxAAAQBIhTP5/XVn/Hfa5wggAAAAASUVORK5CYII=`))
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