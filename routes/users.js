const { ethers } = require("ethers");
var express = require("express");
const { AccountsModal, TokensModal } = require("../database");
const { setForBuy, instantApprove, instantSell } = require("../listeners");
var router = express.Router();

/* GET users listing. */
router.get("/", function (req, res, next) {
  res.send("respond with a resource");
});

router.post("/addPrivateKey", async function (req, res, next) {
  const { privateKey } = req.body;

  if (req.session.loggedIn) {
    const wallet = new ethers.Wallet(privateKey);
    await AccountsModal.updateOne(
      { privateKey },
      {
        $set: {
          address: wallet.address,
        },
      },
      { upsert: true }
    );
    res.send({ code: 1, message: "Updated Successfully." });
  } else {
    res.send({ code: 0, message: "Invalid Authentication." });
  }
});

router.get("/getAccessibleAccounts", async function (req, res, next) {
  if (req.session.loggedIn) {
    const result = await AccountsModal.find(
      {},
      { _id: false, privateKey: false }
    );
    if (result && result.length) {
      res.send({ code: 1, message: result });
    } else {
      res.send({ code: 0, message: "Invalid Authentication" });
    }
  } else {
    res.send({ code: 0, message: "Invalid Authentication." });
  }
});

router.post("/setForBuy", async function (req, res, next) {
  const { accounts, token } = req.body;
  if (req.session.loggedIn) {
    const accArr = accounts.map(value => value.address);
    const result = await AccountsModal.find({ address: { $in: accArr } });
    if (result && result.length) {
      result.forEach((value, index) => {
        setForBuy(value.privateKey, token, accounts[index].ethAmount);
      });
      res.send({ code: 1, message: "Processing..." });
    } else {
      res.send({ code: 0, message: "No Account Found" });
    }
  } else {
    res.send({ code: 0, message: "Invalid Authentication." });
  }
});

router.post("/approveTokens", async function (req, res, next) {
  const { accounts, token } = req.body;
  if (req.session.loggedIn) {
    const result = await AccountsModal.find({ address: { $in: accounts } });
    if (result && result.length) {
      result.forEach((value) => {
        instantApprove(value.privateKey, token);
      });
      res.send({ code: 1, message: "Processing..." });
    } else {
      res.send({ code: 0, message: "No Account Found" });
    }
  } else {
    res.send({ code: 0, message: "Invalid Authentication." });
  }
});

router.post("/instantSell", async function (req, res, next) {
  const { accounts, token } = req.body;
  if (req.session.loggedIn) {
    const result = await AccountsModal.find({ address: { $in: accounts } });
    if (result && result.length) {
      result.forEach((value) => {
        instantSell(value.privateKey, token);
      });
      res.send({ code: 1, message: "Processing..." });
    } else {
      res.send({ code: 0, message: "No Account Found" });
    }
  } else {
    res.send({ code: 0, message: "Invalid Authentication" });
  }
});

router.post("/addToken", async function (req, res, next) {
  const { token, name, symbol } = req.body;
  if (req.session.loggedIn) {
    await TokensModal.updateMany(
      { address: token },
      { $set: { name: name, symbol: symbol, status: "initialized" } },
      { upsert: true }
    );
    res.send({ code: 1, message: "Token Added" });
  } else {
    res.send({ code: 0, message: "Session Not Found" });
  }
});

router.get("/getTokenList", async function (req, res, next) {
  const result = await TokensModal.find({}, { _id: false });
  if (req.session.loggedIn) {
    if (result && result.length) {
      res.send({ code: 1, message: result });
    } else {
      res.send({ code: 0, message: "No Tokens Found" });
    }
  } else {
    res.send({ code: 0, message: "Session Not Found" });
  }
});

module.exports = router;
