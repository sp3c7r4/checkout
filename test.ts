import AdminRepository from "./src/repository/AdminRepository";

console.log(
  await AdminRepository.create({
    first_name: 'spectra',
    last_name: 'gee',
    email: 'spectra@gmail.com',
    password: "Djlacoco24"
  })
)