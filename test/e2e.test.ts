import { parseEther } from "@ethersproject/units";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { AegisERC20, AegisShield, IUniswapV2Router02, IUniswapV2Router02__factory } from "../typechain";

describe("Aegis", function () {
  let aegisERC20: AegisERC20;
  let aegisShield: AegisShield;
  let uniswapRouter: IUniswapV2Router02;
  let deployer: SignerWithAddress,
    user: SignerWithAddress,
    botBuyer: SignerWithAddress,
    userBuyer: SignerWithAddress;
  
  

  const wethAddress = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";

  this.beforeAll("deploy contracts", async function () {
    [deployer, user, botBuyer, userBuyer] = await ethers.getSigners();

    const AegisERC20 = await ethers.getContractFactory("AegisERC20");
    aegisERC20 = await AegisERC20.deploy();
    await aegisERC20.deployed();

    const GasStrategy = await ethers.getContractFactory("AegisGasStrategy");
    const gasStrategy = await GasStrategy.deploy();
    await gasStrategy.deployed();

    const SameBlockStrategy = await ethers.getContractFactory(
      "AegisSameBlockStrategy"
    );
    const sameBlockStrategy = await SameBlockStrategy.deploy();
    await sameBlockStrategy.deployed();

    const AegisShield = await ethers.getContractFactory("AegisShield");
    aegisShield = await AegisShield.deploy(
      [sameBlockStrategy.address, gasStrategy.address],
      aegisERC20.address,
      wethAddress
    );
    await aegisShield.deployed();
    await deployer.sendTransaction({
      to: aegisERC20.address,
      value: parseEther("100"),
    });

    uniswapRouter = IUniswapV2Router02__factory.connect("0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D", user);
    await ethers.provider.send("evm_setAutomine", [false]);
    await ethers.provider.send("evm_setIntervalMining", [1000]);

  });

  it("should list on Uniswap", async function () {
    
    let listingTx = await aegisERC20.list(aegisShield.address);

    let buyTx = await uniswapRouter.swapExactETHForTokens(0, [wethAddress, aegisERC20.address], user.address, Math.floor(Date.now() / 1000) + 1000, {value: parseEther('2')});

    let [listingReceipt, buyReceipt] = await Promise.all([listingTx.wait(), buyTx.wait()]);

    console.log(listingReceipt.blockNumber)
    console.log(buyReceipt.blockNumber);
  });
});
