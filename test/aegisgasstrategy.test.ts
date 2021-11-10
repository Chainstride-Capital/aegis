import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { ethers } from 'hardhat';
// eslint-disable-next-line camelcase
import { AegisERC20, AegisShield, IUniswapV2Router02, IUniswapV2Router02__factory } from '../typechain';

describe('High gas strategy', function () {
  let aegisERC20: AegisERC20;
  let aegisShield: AegisShield;
  let uniswapRouter: IUniswapV2Router02;
  let deployer: SignerWithAddress,
    botOwner: SignerWithAddress,
    botOwnerAlt: SignerWithAddress,
    botBuyer: SignerWithAddress;
  const wethAddress = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2';

  this.beforeAll('deploy contracts', async function () {
    [deployer, botOwner, botOwnerAlt, botBuyer] = await ethers.getSigners();

    const AegisERC20 = await ethers.getContractFactory('AegisERC20');
    aegisERC20 = await AegisERC20.deploy();
    await aegisERC20.deployed();

    const GasStrategy = await ethers.getContractFactory('AegisGasStrategy');
    const gasStrategy = await GasStrategy.deploy(false, 0); // same block strategy should confiscate tokens and not vest
    await gasStrategy.deployed();

    const AegisShield = await ethers.getContractFactory('AegisShield');
    aegisShield = await AegisShield.deploy(
      [gasStrategy.address], // strategies to use
      aegisERC20.address, // address of the token we're protecting
      wethAddress, // pair is with wrapped ether
      0 // uniswap
    );
    await aegisShield.deployed();
    await deployer.sendTransaction({
      to: aegisERC20.address,
      value: ethers.utils.parseEther('100')
    });

    uniswapRouter = IUniswapV2Router02__factory.connect('0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', botOwner);
  });

  it('should blacklist bot buying with high gas price after listing', async function () {
    const listingTx = await (await aegisERC20.list(aegisShield.address)).wait();
    await uniswapRouter
      .connect(botBuyer)
      .swapExactETHForTokens(
        0,
        [wethAddress, aegisERC20.address],
        botOwner.address,
        Math.floor(Date.now() / 1000) + 1000,
        {
          value: ethers.utils.parseEther('2'),
          gasPrice: listingTx.effectiveGasPrice.mul(20)
        }
      );

    await expect(
      aegisERC20.connect(botOwner).transfer(botOwnerAlt.address, ethers.utils.parseEther('1'))
    ).to.be.revertedWith('AEGIS: You are blacklisted');
  });
});
