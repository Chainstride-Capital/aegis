//SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract TokenVesting {
    struct Claim {
        uint256 duration;
        uint256 amount;
        uint256 claimedAmount;
    }

    mapping(address => Claim) public claims;
    uint256 public start;
    IERC20 public token;
    address public treasury;
    address public submitter;

    modifier onlyTreasury() {
        require(msg.sender == treasury, "Not treasury");
        _;
    }

    modifier onlyContributor() {
        require(
            claims[msg.sender].amount > 0,
            "Not a contributor or renounced"
        );
        _;
    }

    modifier onlySubmitter() {
        require(msg.sender == submitter, "Not submitter");
        _;
    }

    constructor(
        address _submitter,
        address _treasury,
        uint256 _start,
        address _token
    ) public {
        submitter = _submitter;
        treasury = _treasury;
        start = _start;
        token = IERC20(_token);
    }

    function submit(
        address _receiver,
        uint256 _end,
        uint256 _amount,
        uint256 _initialPercentage
    ) public onlySubmitter returns (bool) {
        require(_amount > 0, "_amount must be set greater than 0");
        require(_initialPercentage >= 0 && _initialPercentage <= 99, "_initialPercentage must be a number between 0 and 99");
        require(claims[_receiver].amount == 0, "Claim already exists for this _receiver address");

        uint256 initialDistribution = (_amount * _initialPercentage) / 100;
        uint256 vestedDistribution = _amount - initialDistribution;
        bool result = token.transfer(_receiver, initialDistribution);

        claims[_receiver] = Claim(
            (_end - start),
            vestedDistribution,
            0
        );

        return result;
    }

    function submitMulti(
        address[] memory _receivers,
        uint256[] memory _ends,
        uint256[] memory _amounts,
        uint256[] memory _initialPercentages
    ) public onlySubmitter returns (bool) {
        require(_receivers.length <= 256, "Arrays cannot be over 256 in length");
        require((_receivers.length == _ends.length) &&
                (_ends.length == _amounts.length) &&
                (_amounts.length == _initialPercentages.length),
            "All arrays must be the same length"
        );

        for (uint256 i = 0; i < _receivers.length; i++) {
            bool result = submit(
                _receivers[i],
                _ends[i],
                _amounts[i],
                _initialPercentages[i]
            );
            require(result, "A submit call inside the for loop failed");
        }
        return true;
    }

    function claimTokens(uint256 _amount) public onlyContributor returns (bool) {
        require(_amount <= getAvailable(msg.sender), "Balance not sufficient");

        claims[msg.sender].claimedAmount = claims[msg.sender].claimedAmount + _amount;

        return token.transfer(msg.sender, _amount);
    }

    function renounce() public onlyContributor {
        uint256 remainingAmount = claims[msg.sender].amount - claims[msg.sender].claimedAmount;
        token.transfer(treasury, remainingAmount);
        delete claims[msg.sender];
    }

    function deposit(uint256 _amount) public onlyTreasury returns (bool) {
        return token.transferFrom(treasury, address(this), _amount);
    }

    function updateTreasury(address _treasury) public onlyTreasury {
        treasury = _treasury;
    }

    function getAvailable(address _receiver) public view returns (uint256) {
        Claim memory claim = claims[_receiver];

        return vestedAmount(claim) - claim.claimedAmount;
    }

    function vestedAmount(Claim memory claim) internal view returns (uint256) {
        if (block.timestamp < start) {
            return 0;
        } else if (block.timestamp >= start + claim.duration) {
            return claim.amount;
        } else {
            uint256 result = claim.amount * (block.timestamp - start) / claim.duration;

            if(result > claim.amount)
                result = claim.amount;

            return result;
        }

    }
}
