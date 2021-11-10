import * as dotenv from 'dotenv';

import { HardhatUserConfig } from 'hardhat/config';
import '@nomiclabs/hardhat-etherscan';
import '@nomiclabs/hardhat-waffle';
import '@typechain/hardhat';
import 'hardhat-gas-reporter';
import 'solidity-coverage';

dotenv.config();

const config: HardhatUserConfig = {
  solidity: '0.6.12',
  networks: {
    hardhat: {
      forking: {
        url: process.env.MAINNET_URL!,
        blockNumber: 13575777
      },
      allowUnlimitedContractSize: true
    }
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS === 'true',
    currency: 'USD'
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY
  }
};

export default config;
