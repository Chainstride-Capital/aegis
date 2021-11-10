//SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;
pragma experimental ABIEncoderV2;

import "hardhat/console.sol";
import "./AegisStructs.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "./interface/IAegisStrategy.sol";
import "./interface/IAegisShield.sol";

contract AegisShield is IAegisShield {
    using SafeMath for uint256;
    address[] strategies;
    IERC20 token;
    address public listingPair;
    mapping(address => bool) blocked;
    mapping(address => Claim) public claims;

    constructor(
        address[] memory _strategies,
        address _token,
        address _listingPair
    ) public {
        strategies = _strategies;
        token = IERC20(_token);
        listingPair = _listingPair;
    }

    function onTokenTransfer(
        address _from,
        address _to,
        uint256 _amount
    ) public override {
        if (isTokenPurchase()) {
            for (uint256 i = 0; i < strategies.length; i++) {
                AegisStrategyResult memory result = IAegisStrategy(
                    strategies[i]
                ).applyStrategy(_from, _to, _amount);
                if (result.triggered) {
                    blocked[_from] = true;
                    if (result.vest) {}
                }
            }
        } else {
            if (blocked[_from] == true) {
                if (claims[_from].duration != 0) {} else {
                    revert("AEGIS: You are blacklisted");
                }
            }
        }
    }

    function listed() external override {
        for (uint256 i = 0; i < strategies.length; i++) {
            IAegisStrategy(strategies[i]).listed();
        }
    }

    function isTokenPurchase() internal returns (bool) {
        return false;
    }
}
