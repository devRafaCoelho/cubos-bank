const { contas } = require("../database");

const checkGlobalPassword = (req, res, next) => {
    const correctPassword = 'Cubos123Bank';
    const { senha_banco } = req.query;

    if (!senha_banco || senha_banco !== correctPassword) return res.status(401).json({ message: 'incorrect password' });

    next();
};

const checkCPF = (req, res, next) => {
    const { cpf } = req.body;

    if (cpf.length !== 11 || cpf.split('').every(element => { return element === cpf[0] }) || cpf.split('').some(element => { return isNaN(element) })) {
        return res.status(400).json({ message: 'Invalid CPF' });
    }

    contas.forEach((account) => {
        if (account.usuario.cpf === cpf) {
            return res.status(400).json({ message: 'There is already an account with this cpf' });
        }
    });

    next();
}

const checkEmail = (req, res, next) => {
    const { email } = req.body;

    const startingDot = email.slice(0, 1);
    const endingDot = email.slice(-1);
    const hasAtSign = email.includes("@");
    const indexAtSign = email.indexOf("@");
    const hasDotAfterAtSign = email.includes(".", indexAtSign);

    if (!hasAtSign || !hasDotAfterAtSign || startingDot === "." || endingDot === ".") {
        return res.status(400).json({ mensagem: 'Invalid E-mail' });
    }

    contas.forEach((account) => {
        if (account.usuario.email === email) {
            return res.status(400).json({ mensagem: 'There is already an account with this cpf' });
        }
    });

    next();
}

module.exports = { checkGlobalPassword, checkCPF, checkEmail }