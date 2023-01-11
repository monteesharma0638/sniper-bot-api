// getting-started.js
const mongoose = require('mongoose');

main().catch(err => console.log(err));

async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/sniperbot');  
  // use `await mongoose.connect('mongodb://user:password@127.0.0.1:27017/test');` if your database has auth enabled
}

const AccountsSchema = new mongoose.Schema({
    address: String,
    privateKey: String
})

const TokensSchema = new mongoose.Schema({
    address: String,
    buyAccounts: [String],
    name: String,
    symbol: String,
    status: String
})

const AccountsModal = mongoose.model("accounts", AccountsSchema);
const TokensModal = mongoose.model("tokens", TokensSchema);

module.exports = {
    AccountsModal,
    TokensModal,
    mongoose
}