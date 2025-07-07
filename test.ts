import { db } from "./src/db";
import { getUserById } from "./src/helpers/user";
import { checkProductTool } from "./src/mastra/tools";
import AdminRepository from "./src/repository/AdminRepository";
import BusinessRepository from "./src/repository/BusinessRepository";
import CartRepository from "./src/repository/CartRepository";
import ProductRepository from "./src/repository/ProductRepository";
import UserRepository from "./src/repository/UserRepository";

// console.log(
//   await AdminRepository.create({
//     first_name: 'spectra',
//     last_name: 'gee',
//     email: 'spectra@gmail.com',
//     password: "Djlacoco24"
//   })
// )

// console.log(await AdminRepository.getUsers())

// console.log(await db.query.user.findFirst({
//   where: (u, { eq }) => eq(u.id, 6178017781),
// }));

// console.log(await checkProductTool.execute({context: { business_id: '01JYE8PRGYRNBMMZMAMMBRV1SV' }}))
const prods = [{
        "quantity": 10,
        "price": 300,
        "id": "01JZG4QV166R0JBMN05V4QTFTP"
    }, {
        "id": "01JZG36A1Z2BXYBGX88773BBGM",
        "price": 300,
        "quantity": 5
    }]
console.log(await CartRepository.storeProductInCart('6178017781', '01JYE8PRGYRNBMMZMAMMBRV1SV', prods))
// console.log(await ProductRepository.readProductsByIds(['01JZG4QV166R0JBMN05V4QTFTP', '01JZG36A1Z2BXYBGX88773BBGM']))