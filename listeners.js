const ethers = require("ethers");
const factoryAbi = require("./abi/Factory.json");
const routerAbi = require("./abi/Router.json");
const pairAbi = require("./abi/Pair.json");
const erc20Abi = require("@openzeppelin/contracts/build/contracts/ERC20.json");
const { TokensModal } = require("./database");
const router = require("./routes");

const provider = new ethers.providers.getDefaultProvider(
  "https://eth-goerli.g.alchemy.com/v2/FluZ4jwUQODHbXzgJ2hwYBAOI-7NP4oD"
);
const factoryAddress = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";
const wethAddress = "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6";
const routerAddress = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";

const setForBuy = async (privateKey, token, amount) => {
  try {
    const wallet = new ethers.Wallet(privateKey, provider);
    const factoryContract = new ethers.Contract(
      factoryAddress,
      factoryAbi,
      wallet
    );
    const pairAddress = await factoryContract.getPair(wethAddress, token);
    console.log("got the pair", pairAddress);
    await TokensModal.updateOne(
      { address: token },
      { $set: { status: "pending" } }
    );
    if (ethers.utils.getAddress(pairAddress) === ethers.constants.AddressZero) {
      setTimeout(() => {
        setForBuy(privateKey, token, amount);
      }, 2000);
    } else {
      const wethContract = new ethers.Contract(
        wethAddress,
        erc20Abi.abi,
        wallet
      );
      const tokenContract = new ethers.Contract(token, erc20Abi.abi, wallet);
      const balance = await wethContract.balanceOf(pairAddress);
      const tokenBalance = await tokenContract.balanceOf(pairAddress);
      if (Number(balance) > 0 && Number(tokenBalance) > 0) {
        setTimeout(async () => {
            await TokensModal.updateOne(
              { address: token },
              { $set: { status: "processing" } }
            );
    
            const routerContract = new ethers.Contract(
              routerAddress,
              routerAbi,
              wallet
            );
            console.log(amount);
    
            await routerContract.swapExactETHForTokens(
              0,
              [wethAddress, token],
              wallet.address,
              parseFloat(new Date().getTime() / 1000).toFixed(0) + 100,
              { value: new ethers.BigNumber.from(amount) }
            );
            await TokensModal.updateOne(
              { address: token },
              {
                $set: { status: "completed" },
                $push: { buyAccounts: wallet.address },
              }
            );
        }, 1000);
      } else {
        setTimeout(() => {
          setForBuy(privateKey, token, amount);
        }, 2000);
      }
    }
  } catch (err) {
    console.log(err);
  }
};

const instantSell = async (privateKey, token) => {
  try {
    const wallet = new ethers.Wallet(privateKey, provider);
    const router = new ethers.Contract(routerAddress, routerAbi, wallet);
    const tokenContract = new ethers.Contract(token, erc20Abi.abi, provider);
    const balance = await tokenContract.balanceOf(wallet.address);
    await router.swapExactTokensForETH(
      balance,
      0,
      [token, wethAddress],
      wallet.address,
      parseFloat(new Date().getTime() / 1000).toFixed(0) + 100
    );
    await TokensModal.updateOne(
      { address: token },
      {
        $set: { status: "sold" },
        $pull: { buyAccounts: wallet.address },
      }
    );
  } catch (err) {
    console.log(err);
  }
};

const instantApprove = async (privateKey, token) => {
  try {
    const wallet = new ethers.Wallet(privateKey, provider);
    const tokenContract = new ethers.Contract(token, erc20Abi.abi, wallet);
    await tokenContract.approve(routerAddress, ethers.constants.MaxUint256);
  } catch (err) {
    console.log(err);
  }
};

const approved = async (address, token) => {
  const tokenContract = new ethers.Contract(token, erc20Abi, provider);
  const allowance = await token.allowance(address, routerAddress);
  const balance = await tokenContract.balanceOf(address);
  if (Number(allowance) >= Number(balance)) {
    return true;
  } else {
    return false;
  }
};

module.exports = {
  provider,
  setForBuy,
  instantSell,
  instantApprove,
  approved,
};
