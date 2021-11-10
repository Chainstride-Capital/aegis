//SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;
pragma experimental ABIEncoderV2;
import "../AegisStructs.sol";


interface IAegisStrategy {
    function applyStrategy(
        address _from,
        address _to,
        uint256 _amount
    ) external returns (AegisStructs.AegisStrategyResult memory);

    function listed() external;
}

