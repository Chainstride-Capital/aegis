# Aegis

A suite of Ethereum smart contracts to shield you from bad actors and mempool snipers when listing a new token on a decentralized exchange.

### The problem

New projects on EVM-compatible chains often use AMM-based decentralized exchanges to allow users to buy and sell their tokens. When tokens are initially listed, there is a large financial incentive to be the first person to buy the token - if there is strong buy pressure, the first buyer(s) will be able to sell their tokens for a large profit, essentially risk free. This creates an incentive for mempool-based sniping bots to listen for the listing transaction and buy the token before anyone else. On Ethereum, this is often achieved by using Flashbots, and on other chains, by collaborating with validators, or by monitoring the mempool and submitting buy transactions using highly gas-optimised smart contracts using the same gas price as the listing transaction, thereby being the next transaction in the block after the listing.

Whilst this practice generates great profits for the operators of these bots, it essentially defrauds early retail buyers, often leading them to buy at highly inflated prices, only then for the token price to dump as the bots sell their tokens. Whilst some "launch protection" systems already exist, most rely on limiting the number of buys per end-user address, or by limiting the number of tokens which can be bought at the start of the sale. Both of these measures can be trivially countered by sophisticated bot makers.

### The solution

Aegis allows the deployers of ERC20 tokens to integrate with a simple smart contract which will be able to apply multiple customizable strategies in order to detect and prevent mempool sniping bots from buying the token. Each project deploys an Aegis smart contract along with their token, using a different EOA account. Strategies used can be pre-defined (see the "strategies" folder), or can be written from scratch by the project in question. 

Although snipers may see that a given token uses Aegis, they will not be able to predict which strategies the token will use to detect and prevent them, as the Aegis smart contract itself is only set in the listed ERC20 token at the moment of listing. Aegis contracts are also not expected to be verified on Etherscan, meaning that just-in-time analysis of the strategies in use will be extremely difficult.

If a sniper is detected by any of the strategies, its tokens can either be confiscated, locked in a vesting mechanism, or subsequently minted back to the AMM pool. This lattermost strategy effectively turns the bot snipe into additional free liquidity for your token.

### Built-in strategies

Aegis comes with two built-in strategies to prevent mempool. These are designed to prevent the majority of bots, but as with any strategy, determined adversaries may be able to circumvent them, which is why we recommend implementing your own strategies in addition to the included ones. Included strategies are:

- Same block strategy: many sniping bots will attempt to buy the token in the same block that it is listed. No DEX frontend allows normal end users to do this, so any buys in the same block as listing can be assumed to be bots and blacklisted
- Gas strategy: bots often use very high gas prices to be the first transaction in the blocks after the token listing. This strategies blacklists bots buys if the gas price in the first 5 blocks after the listing is unusually high. As this strategy may result in some false positives, it is recommended not to fully confiscate tokens purchased in this manner, and instead to vest them.