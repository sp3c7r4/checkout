import AdminRepository from "./src/repository/AdminRepository";
import BusinessRepository from "./src/repository/BusinessRepository";

// console.log(
//   await AdminRepository.create({
//     first_name: 'spectra',
//     last_name: 'gee',
//     email: 'spectra@gmail.com',
//     password: "Djlacoco24"
//   })
// )

// console.log(await AdminRepository.getUsers())

console.log(await BusinessRepository.readOneByAdminId())