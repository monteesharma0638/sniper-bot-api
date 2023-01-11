const ethers = require("ethers");
const factoryAbi = require("./abi/Factory.json");
const routerAbi = require("./abi/Router.json");
const pairAbi = require("./abi/Pair.json");
const erc20Abi = require("@openzeppelin/contracts/build/contracts/ERC20.json");

const provider = new ethers.providers.EtherscanProvider("homestead", "VXQ4BQ8FG4NQBK7YZP9SD548U8R1A6RC6U");
const factoryAddress = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";
const wethAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
const routerAddress = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";

const setForBuy = async (privateKey, token, amount) => {
    const wallet = new ethers.Wallet(privateKey, provider);
    const factoryContract = new ethers.Contract(factoryAddress, factoryAbi, wallet);
    const pairAddress =  await factoryContract.getPair(wethAddress, token);
    if(ethers.utils.getAddress(pairAddress) === ethers.constants.AddressZero){
        setTimeout(() => {
            setForBuy(privateKey, token);
        }, 2000)
    }
    else {
        const pairContract = new ethers.Contract(pairAddress, pairAbi, wallet);
        const {_reserve0, _reserve1} = pairContract.getReserves();
        if(Number(_reserve0) > 0 && Number(_reserve1) > 0){
            const routerContract = new ethers.Contract(routerAddress, routerAbi, wallet);
            await routerContract.swapExactETHForTokens([wethAddress, token], wallet.address, parseFloat(new Date().getTime()/1000).toFixed(0) + 100, {value: amount}).wait();
        } 
        else {
            setTimeout(()=> {
                setForBuy(privateKey, token, amount);
            }, 2000)
        }     
    }
}

const instantSell = async (privateKey, token) => {
    const wallet = new ethers.Wallet(privateKey, provider);
    const router = new ethers.Contract(routerAddress, routerAbi, wallet);
    const token = new ethers.Contract(token, erc20Abi, provider);
    const balance = await token.balanceOf(wallet.address);
    await router.swapExactTokensForEth(balance, [token, wethAddress], wallet.address, parseFloat(new Date().getTime()/1000).toFixed(0)+100).wait();   
}

const instantApprove = async (privateKey, token) => {
    const wallet = new ethers.Wallet(privateKey, provider);
    const token = new ethers.Contract(token, erc20Abi, wallet);
    await token.approve(routerAddress, ethers.constants.MaxUint256).wait();
}

const approved = async (address, token) => {
    const token = new ethers.Contract(token, erc20Abi, provider);
    const allowance = await token.allowance(address, routerAddress);
    const balance = await token.balanceOf(address);
    if(Number(allowance) >= Number(balance)){
        return true;
    }
    else {
        return false;
    }
}

module.exports = {
    provider,
    setForBuy,
    instantSell,
    instantApprove,
    approved
}