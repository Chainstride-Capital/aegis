library AegisStructs {
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
}
