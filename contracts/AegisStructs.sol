//SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;
pragma experimental ABIEncoderV2;

struct AegisStrategyResult {
    bool triggered;
    bool vest;
    uint256 duration;
}

struct Claim {
    uint256 duration;
    uint256 amount;
    uint256 claimedAmount;
}
