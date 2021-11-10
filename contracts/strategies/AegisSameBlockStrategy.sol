//SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;
pragma experimental ABIEncoderV2;

import "../AegisStructs.sol";
import "../interface/IAegisStrategy.sol";


contract AegisSameBlockStrategy is IAegisStrategy {
    uint256 private _listingBlock;

    function applyStrategy(
        address _from,
        address _to,
        uint256 _amount
    ) external override returns (AegisStructs.AegisStrategyResult memory) {
        
    }

    function listed() override external {
        _listingBlock = block.number;
    }
}