import { parseEther } from '@ethersproject/units';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { ethers } from 'hardhat';
import { AegisERC20, AegisShield, IUniswapV2Router02, IUniswapV2Router02__factory } from '../typechain';

describe('Aegis', function () {
  let aegisERC20: AegisERC20;
  let aegisShield: AegisShield;
  let uniswapRouter: IUniswapV2Router02;
  let deployer: SignerWithAddress, user: SignerWithAddress, botBuyer: SignerWithAddress, userBuyer: SignerWithAddress;

  const wethAddress = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2';

  this.beforeAll('deploy contracts', async function () {
    [deployer, user, botBuyer, userBuyer] = await ethers.getSigners();

    const AegisERC20 = await ethers.getContractFactory('AegisERC20');
    aegisERC20 = await AegisERC20.deploy();
    await aegisERC20.deployed();

    const GasStrategy = await ethers.getContractFactory('AegisGasStrategy');
    const gasStrategy = await GasStrategy.deploy();
    await gasStrategy.deployed();

    const SameBlockStrategy = await ethers.getContractFactory('AegisSameBlockStrategy');
    const sameBlockStrategy = await SameBlockStrategy.deploy(100, true, 3600 * 24 * 90);
    await sameBlockStrategy.deployed();

    const AegisShield = await ethers.getContractFactory('AegisShield');
    aegisShield = await AegisShield.deploy(
      [gasStrategy.address, sameBlockStrategy.address],
      aegisERC20.address,
      wethAddress,
      0 // uniswap
    );
    await aegisShield.deployed();
    await deployer.sendTransaction({
      to: aegisERC20.address,
      value: parseEther('100')
    });

    uniswapRouter = IUniswapV2Router02__factory.connect('0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', user);
  });

  it('should list on Uniswap', async function () {
    await ethers.provider.send('evm_setAutomine', [false]);
    let listingTx = await aegisERC20.list(aegisShield.address);
    let buyTx = await uniswapRouter
      .connect(botBuyer)
      .swapExactETHForTokens(0, [wethAddress, aegisERC20.address], user.address, Math.floor(Date.now() / 1000) + 1000, {
        value: parseEther('2')
      });

    const blockBefore = await ethers.provider.getBlock('latest');
    await ethers.provider.send('evm_mine', [blockBefore.timestamp + 10]);

    await ethers.provider.send('evm_setAutomine', [true]);

    await listingTx.wait();
    await buyTx.wait();
  });
});
