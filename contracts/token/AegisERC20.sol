//SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import "../interface/IAegisShield.sol";

contract AegisERC20 is ERC20, Ownable {
    IAegisShield private _shield;    

    constructor() public ERC20("Test", "TST") {
        _mint(msg.sender, 1000e18);
    }

    function list(address shield) public onlyOwner {
        _shield = IAegisShield(shield);
        address router = 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D;
        uint256 numList = 1000e18;
        _approve(msg.sender, router, numList);

        IUniswapV2Router02(router).addLiquidityETH{
            value: address(this).balance
        }(
            address(this),
            numList,
            numList,
            address(this).balance,
            tx.origin,
            block.timestamp + 600
        );
        _shield.listed();
    }

    function _transfer(address sender, address recipient, uint256 amount) override internal {
        if (address(_shield) != address(0) ) {
            _shield.onTokenTransfer(sender, recipient, amount);
        }
        super._transfer(sender, recipient, amount);
    }
}
