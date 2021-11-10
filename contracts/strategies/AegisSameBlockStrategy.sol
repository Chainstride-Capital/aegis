//SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;
pragma experimental ABIEncoderV2;

import "hardhat/console.sol";

import "../AegisStructs.sol";
import "../interface/IAegisStrategy.sol";

contract AegisSameBlockStrategy is IAegisStrategy {
    uint256 private _listingBlock;
    uint256 private _percentBlock;
    bool private _vest;
    uint256 private _vestingPeriod;

    constructor(
        uint256 percentBlock,
        bool vest,
        uint256 vestingPeriod
    ) public {
        _percentBlock = percentBlock;
        _vest = vest;
        _vestingPeriod = vestingPeriod;
    }

    function applyStrategy(
        address from,
        address to,
        uint256 amount
    ) external override returns (AegisStrategyResult memory) {
        console.log(block.number);
        console.log(_listingBlock);
        bool triggered = block.number == _listingBlock;
        console.log("Triggered: %s", triggered);
        return AegisStrategyResult(triggered, _percentBlock, _vest, _vestingPeriod);
    }

    function listed() external override {
        _listingBlock = block.number;
    }
}
