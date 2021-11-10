//SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;
pragma experimental ABIEncoderV2;

import "../AegisStructs.sol";
import "../interface/IAegisStrategy.sol";

contract AegisGasStrategy is IAegisStrategy {
    function applyStrategy(
        address _from,
        address _to,
        uint256 _amount
    ) external override returns (AegisStrategyResult memory) {
        
    }

    function listed() external override {
        return;
    }
}