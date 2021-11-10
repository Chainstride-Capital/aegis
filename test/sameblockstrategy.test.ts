import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { ethers } from 'hardhat';
// eslint-disable-next-line camelcase
import { AegisERC20, AegisShield, IUniswapV2Router02, IUniswapV2Router02__factory } from '../typechain';

const increaseTime = async (timeSpan: number, number: number) => {
  await ethers.provider.send('evm_increaseTime', [timeSpan * number]);
  await ethers.provider.send('evm_mine', []);
};

describe('Same block strategy', function () {
  let aegisERC20: AegisERC20;
  let aegisShield: AegisShield;
  let uniswapRouter: IUniswapV2Router02;
  let deployer: SignerWithAddress,
    botOwner: SignerWithAddress,
    botOwnerAlt: SignerWithAddress,
    botBuyer: SignerWithAddress,
    userBuyer: SignerWithAddress;

  const wethAddress = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2';

  this.beforeAll('deploy contracts', async function () {
    [deployer, botOwner, botOwnerAlt, botBuyer, userBuyer] = await ethers.getSigners();

    const AegisERC20 = await ethers.getContractFactory('AegisERC20');
    aegisERC20 = await AegisERC20.deploy();
    await aegisERC20.deployed();

    const SameBlockStrategy = await ethers.getContractFactory('AegisSameBlockStrategy');
    const sameBlockStrategy = await SameBlockStrategy.deploy(true, 3600 * 24 * 90); // same block strategy should vest tokens over ~90 days
    await sameBlockStrategy.deployed();

    const AegisShield = await ethers.getContractFactory('AegisShield');
    aegisShield = await AegisShield.deploy(
      [sameBlockStrategy.address], // strategies to use
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

  it('should blacklist bot buying immediately after Uniswap listing', async function () {
    await ethers.provider.send('evm_setAutomine', [false]);
    const listingTx = await aegisERC20.list(aegisShield.address); // ERC20 token is only aware of location of Aegis contract at the moment of listing, meaning that snipers cannot probe anti-bot logic ahead of token listing
    const buyTx = await uniswapRouter
      .connect(botBuyer)
      .swapExactETHForTokens(
        0,
        [wethAddress, aegisERC20.address],
        botOwner.address,
        Math.floor(Date.now() / 1000) + 1000,
        {
          value: ethers.utils.parseEther('2')
        }
      );

    const blockBefore = await ethers.provider.getBlock('latest');
    await ethers.provider.send('evm_mine', [blockBefore.timestamp + 10]);

    await ethers.provider.send('evm_setAutomine', [true]);

    await listingTx.wait();
    await buyTx.wait();

    await expect(
      aegisERC20.connect(botOwner).transfer(botOwnerAlt.address, ethers.utils.parseEther('1'))
    ).to.be.revertedWith('AEGIS: vested tokens insufficient');
  });

  it('user should be able to buy as normal after listing block', async function () {
    await uniswapRouter
      .connect(userBuyer)
      .swapExactETHForTokens(
        0,
        [wethAddress, aegisERC20.address],
        userBuyer.address,
        Math.floor(Date.now() / 1000) + 1000,
        {
          value: ethers.utils.parseEther('2')
        }
      );
    const userBalance = await aegisERC20.balanceOf(userBuyer.address);

    await aegisERC20.connect(userBuyer).transfer(botOwnerAlt.address, userBalance);
  });

  it('should allow bot to spend some tokens after vesting period, but reject additional spends', async function () {
    await increaseTime(3600 * 24, 46);

    let botOwnerBalance = await aegisERC20.balanceOf(botOwner.address);
    await aegisERC20.connect(botOwner).transfer(botOwnerAlt.address, botOwnerBalance.div(2));

    botOwnerBalance = await aegisERC20.balanceOf(botOwner.address);

    await expect(aegisERC20.connect(botOwner).transfer(botOwnerAlt.address, botOwnerBalance)).to.be.revertedWith(
      'AEGIS: vested tokens insufficient'
    );
  });

  it('should allow bot owner to spend all tokens after vesting period', async function () {
    await increaseTime(3600 * 24, 46);
    const botOwnerBalance = await aegisERC20.balanceOf(botOwner.address);
    await aegisERC20.connect(botOwner).transfer(botOwnerAlt.address, botOwnerBalance);
  });
});
