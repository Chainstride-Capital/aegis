//SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;
pragma experimental ABIEncoderV2;


interface IAegisShield {
    function onTokenTransfer(
        address _from,
        address _to,
        uint256 _amount
    ) external;
    function listed() external;
}