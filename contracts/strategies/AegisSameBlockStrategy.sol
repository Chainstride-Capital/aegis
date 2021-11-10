//SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;
pragma experimental ABIEncoderV2;

import "hardhat/console.sol";

import "../AegisStructs.sol";
import "../interface/IAegisStrategy.sol";

contract AegisSameBlockStrategy is IAegisStrategy {
    uint256 private _listingBlock;
    bool private _vest;
    uint256 private _vestingDuration;

    constructor(bool vest, uint256 vestingDuration) public {
        _vest = vest;
        _vestingDuration = vestingDuration;
    }

    function applyStrategy(
        address from,
        address to,
        uint256 amount
    ) external override returns (AegisStrategyResult memory) {
        bool triggered = block.number == _listingBlock;
        return AegisStrategyResult(triggered, _vest, _vestingDuration);
    }

    function listed() external override {
        _listingBlock = block.number;
    }
}
