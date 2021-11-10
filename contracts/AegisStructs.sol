//SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;
pragma experimental ABIEncoderV2;

struct AegisStrategyResult {
    bool triggered;
    uint256 percentBlock;
    bool vest;
    uint256 vestingPeriod;
}

struct Claim {
    uint256 duration;
    uint256 amount;
    uint256 claimedAmount;
}
