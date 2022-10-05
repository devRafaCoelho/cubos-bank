const { format } = require('date-fns');
let { contas, saques, depositos, transferencias } = require('../database');
let idConta = 1;

//Global Functions
const required = (res, object) => {
    for (let item in object) {
        if (!object[item]) {
            res.status(400).json({ mensagem: `The ${item} is required` });
            return false;
        }
    }

    return true;
}

const findAccount = (res, numberAccount) => {
    const account = contas.find((account) => {
        return account.numero === Number(numberAccount);
    });

    if (!account) {
        return res.status(404).json({ mensagem: 'Account not found.' })
    }

    return account;
}

//Specific Functions
const listAccounts = (req, res) => {
    return res.status(200).json(contas);
}

const createAccount = (req, res) => {
    const { nome, cpf, data_nascimento, telefone, email, senha } = req.body;

    if (!required(res, { nome, cpf, data_nascimento, telefone, email, senha })) {
        return;
    }

    const newAaccount = {
        numero: idConta++,
        saldo: 0,
        usuario: {
            nome,
            cpf,
            data_nascimento,
            telefone,
            email,
            senha
        }
    }

    contas.push(newAaccount);
    return res.status(201).json();
}

const updateUser = (req, res) => {
    const { numeroConta } = req.params;
    const { nome, cpf, data_nascimento, telefone, email, senha } = req.body;

    if (!required(res, { nome, cpf, data_nascimento, telefone, email, senha })) {
        return;
    }

    const account = findAccount(res, numeroConta);
    account.usuario.nome = nome;
    account.usuario.cpf = cpf;
    account.usuario.data_nascimento = format(new Date(data_nascimento), 'dd-MM-yyyy');
    account.usuario.telefone = telefone;
    account.usuario.email = email;
    account.usuario.senha = senha;

    return res.status(204).send();
}

const deleteAccount = (req, res) => {
    const { numeroConta } = req.params;
    let index;

    const account = findAccount(res, numeroConta);

    if (account.saldo !== 0) {
        return res.status(404).json({ mensagem: 'The account can only be removed if the balance is zero' })
    }

    contas.splice(index, 1);
    return res.status(204).send();
}

const deposit = (req, res) => {
    const { numero_conta, valor } = req.body;

    if (!required(res, { numero_conta, valor })) {
        return;
    }

    const account = findAccount(res, numero_conta);

    if (valor > 0) {
        account.saldo += valor;
    } else {
        return res.status(404).json({ mensagem: 'The value must be greater than zero' })
    }

    depositos.push({
        data: format(new Date(), 'dd-MM-yyyy HH:mm:ss'),
        numero_conta,
        valor
    });
    return res.status(200).json(depositos);
}

const withdraw = (req, res) => {
    const { numero_conta, valor, senha } = req.body;

    if (!required(res, { numero_conta, valor, senha })) {
        return;
    }

    const account = findAccount(res, numero_conta);

    if (valor > account.saldo) {
        return res.status(404).json({ mensagem: 'Insufficient funds' });
    }

    if (senha !== account.usuario.senha) {
        return res.status(404).json({ mensagem: 'Invalid password' });
    }

    account.saldo -= valor;

    saques.push({
        data: format(new Date(), 'dd-MM-yyyy HH:mm:ss'),
        numero_conta,
        valor
    });

    return res.status(200).json(saques);
}

const tranfer = (req, res) => {
    const { numero_conta_origem, numero_conta_destino, valor, senha } = req.body

    if (!required(res, { numero_conta_origem, numero_conta_destino, valor, senha })) {
        return;
    }

    const originAccount = contas.find((conta) => {
        return conta.numero === numero_conta_origem;
    });

    if (senha !== originAccount.usuario.senha) {
        return res.status(404).json({ mensagem: 'Ivalid password' })
    }

    const destinyAccount = contas.find((conta) => {
        return conta.numero === numero_conta_destino;
    });

    if (valor > originAccount.saldo) {
        return res.status(404).json({ mensagem: 'Insufficient funds' });
    }

    originAccount.saldo -= valor;
    destinyAccount.saldo += valor;

    transferencias.push({
        numero_conta_origem,
        numero_conta_destino,
        valor,
        senha
    });

    return res.status(200).json(transferencias);
}

const balance = (req, res) => {
    const { numero_conta, senha } = req.query;

    if (!required(res, { numero_conta, senha })) {
        return;
    }

    const account = findAccount(res, numero_conta);

    if (account.usuario.senha === senha) {
        return res.status(200).json({ saldo: account.saldo });
    } else {
        return res.status(400).json({ mensagem: 'Invalid password' });
    }
}

const extract = (req, res) => {
    const { numero_conta, senha } = req.query;

    if (!required(res, { numero_conta, senha })) {
        return;
    }

    const account = findAccount(res, numero_conta);

    if (account.usuario.senha != senha) {
        return res.status(400).json({ mensagem: 'Invalid password' });
    }

    const extractAccount = {
        depositos: [],
        saques: [],
        transferenciasEviadas: [],
        transferenciasRecebidas: []
    }

    depositos.forEach((deposito) => {
        if (deposito.numero_conta === Number(numero_conta)) {
            extractAccount.depositos.push(deposito)
        }
    });

    saques.forEach((saque) => {
        if (saque.numero_conta === Number(numero_conta)) {
            extractAccount.saques.push(saque)
        }
    });

    transferencias.forEach((transferencia) => {
        if (transferencia.numero_conta_origem === Number(numero_conta)) {
            extractAccount.transferenciasEviadas.push(transferencia)
        } else if (transferencia.numero_conta_destino === Number(numero_conta)) {
            extractAccount.transferenciasRecebidas.push(transferencia)
        }
    });

    return res.status(200).send(extractAccount);
}

module.exports = {
    listAccounts,
    createAccount,
    updateUser,
    deleteAccount,
    deposit,
    withdraw,
    tranfer,
    balance,
    extract
}