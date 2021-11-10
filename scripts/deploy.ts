import { ethers } from 'hardhat';

async function main() {
  const wethAddress = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2';
  
  const AegisERC20 = await ethers.getContractFactory('AegisERC20');
  const aegisERC20 = await AegisERC20.deploy();
  await aegisERC20.deployed();
  console.log(`Example Aegis ERC20 deployed to ${aegisERC20.address}`);

  const SameBlockStrategy = await ethers.getContractFactory('AegisSameBlockStrategy');
  const sameBlockStrategy = await SameBlockStrategy.deploy(true, 3600 * 24 * 90); // same block strategy should vest tokens over ~90 days
  await sameBlockStrategy.deployed();

  const AegisShield = await ethers.getContractFactory('AegisShield');
  const aegisShield = await AegisShield.deploy(
    [sameBlockStrategy.address], // strategies to use
    aegisERC20.address, // address of the token we're protecting
    wethAddress, // pair is with wrapped ether
    0 // uniswap
  );
  await aegisShield.deployed();
  console.log(`Aegis Shield deployed to ${aegisShield.address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
