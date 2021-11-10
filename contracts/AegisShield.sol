//SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "hardhat/console.sol";

import "./AegisStructs.sol";
import "./interface/IAegisShield.sol";
import "./interface/IAegisStrategy.sol";

contract AegisShield is IAegisShield, Ownable {
    using SafeMath for uint256;

    address[] private strategies;
    IERC20 private token;
    address private listingPair;
    address private uniswapPair;
    mapping(address => bool) public blocked;
    mapping(address => Claim) public claims;

    enum DEX {
        Uniswap,
        Pancakeswap
    }

    constructor(
        address[] memory _strategies,
        address _token,
        address _listingPair,
        DEX dex
    ) public {
        strategies = _strategies;
        token = IERC20(_token);
        listingPair = _listingPair;
        if (dex == DEX.Uniswap) {
            uniswapPair = pairFor(
                0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f,
                (hex"96e8ac4277198ff8b6f785478aa9a39f403cb768dd02cbee326c3e7da348845f"),
                _token,
                _listingPair
            );
        }
    }

    function onTokenTransfer(
        address _from,
        address _to,
        uint256 _amount
    ) public override {
        if (isTokenPurchase(_from)) {
            for (uint256 i = 0; i < strategies.length; i++) {
                AegisStrategyResult memory result = IAegisStrategy(strategies[i]).applyStrategy(_from, _to, _amount);
                if (result.triggered) {
                    blocked[_from] = true;
                }
            }
        } else {
            if (blocked[_from] == true) {
                if (claims[_from].duration == 0) {} else {
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

    function isTokenPurchase(address from) internal view returns (bool) {
        return from == uniswapPair;
    }

    function sortTokens(address tokenA, address tokenB) internal pure returns (address token0, address token1) {
        require(tokenA != tokenB, "IDENTICAL_ADDRESSES");
        (token0, token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        require(token0 != address(0), "ZERO_ADDRESS");
    }

    function pairFor(
        address factory,
        bytes memory initCodeHash,
        address tokenA,
        address tokenB
    ) internal pure returns (address pair) {
        (address token0, address token1) = sortTokens(tokenA, tokenB);
        pair = address(
            uint256(
                keccak256(abi.encodePacked(hex"ff", factory, keccak256(abi.encodePacked(token0, token1)), initCodeHash))
            )
        );
    }
}
