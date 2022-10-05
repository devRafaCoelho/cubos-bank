const express = require('express');
const bank = require('./controllers/bank');
const { checkCPF, checkEmail, checkGlobalPassword } = require('./middleware/validations');

const routes = express();

routes.get('/contas', checkGlobalPassword, bank.listAccounts);
routes.post('/contas', checkCPF, checkEmail, bank.createAccount);
routes.put('/contas/:numeroConta/usuario', bank.updateUser);
routes.delete('/contas/:numeroConta', bank.deleteAccount);
routes.post('/transacoes/depositar', bank.deposit);
routes.post('/transacoes/sacar', bank.withdraw);
routes.post('/transacoes/transferir', bank.tranfer);
routes.get('/contas/saldo', bank.balance);
routes.get('/contas/extrato', bank.extract);

module.exports = routes;