---
headers:
  Cache-Control: public, max-age=0, must-revalidate, s-maxage=2592000
links:
---

In this tutorial, we'll get back in to the Smart Contract written in the previous clarity series, [Implementing a voting system](https://www.clearness.dev/01-voting-clarity-smart-contract/01-getting-started), and add to it a NFT to reward voters.

This digital token will allow voter to prove and showcase the fact that they voted and participated to the project. In real-world project, we could even give more utility to the NFT, such as giving access to event or other votes.

I'll assume that you are familiar with NFTs. Let's dive into the code.

## The SIP009 NFT standard.

Stacks Improvement Proposals (SIPs) are documents that describe new features for the Stacks Blockchain. Learn more on [GitHub](https://github.com/stacksgov/sips). The [SIP009](https://github.com/stacksgov/sips/blob/main/sips/sip-009/sip-009-nft-standard.md) in particular introduced the support for NFTs on Stacks. In a nutshell, the SIP 009 contract implements the "traits" needed to implement standard NFTs in a Smart Contract.


Add the SIP locally so that we can rely on it.

## Create Smart

```sh
$ clarinet contract new sip009-nft-trait
```

Copy past
#### ./contracts/sip009-nft-trait.clar
```clarity
(define-trait sip009-nft-trait
  (
    ;; Last token ID, limited to uint range
    (get-last-token-id () (response uint uint))

    ;; URI for metadata associated with the token 
    (get-token-uri (uint) (response (optional (string-ascii 256)) uint))

    ;; Owner of a given token identifier
    (get-owner (uint) (response (optional principal) uint))

    ;; Transfer from the sender to a new principal
    (transfer (uint principal principal) (response bool uint))
  )
)
```

Delete `tests/sip009-nft-trait_test.clar` since we won't need to test this contract.

Add the following lines to our contract to implement the SIP traits:

#### ./votes/color-vote.clar
```clarity
(impl-trait .sip009-nft-trait.sip009-nft-trait)
;; SIP009 NFT trait on mainnet
;; (impl-trait 'SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9.nft-trait.nft-trait)

;; ...
```

Before deploying our smart contract to production, we'll uncomment line 2 and 3 and remove line 1. So that we don't have to deploy our version of the SIP009, we'll rely on the official one already deployed on the mainnet.

At the stage, clarinet will show errors in our contract. It's because we now need to implement the variable and methods described in the SIP009 traits.

## Basic implementation of the required methods

At the end of the contract:

```clarity
;; ...

(define-read-only (get-last-token-id)
  (ok (var-get last-token-id))
)

(define-read-only (get-token-uri (token-id uint))
  (ok none)
)

(define-read-only (get-owner (token-id uint))
  (ok (nft-get-owner? color-vote-reward token-id))
)

(define-public (transfer
  (token-id uint)
  (sender principal)
  (recipient principal)
)
  (begin
    (asserts! (is-eq tx-sender sender) ERR_FORBIDDEN)
    (nft-transfer? color-vote-reward token-id sender recipient)
  )
)

;; ...
;; contract error codes
```

We'll come back to `get-token-uri` later in the article. You might also have notices the comment, this tells Clarinet that we don't need to check the params passed to the function. 


## Going further

The clarity books provides a great overview about the SIP-009 NFT standard as well in these two articles:

- [Official Documentation](https://docs.stacks.co/write-smart-contracts/tokens#non-fungible-tokens-nfts)
- [SIP009: the NFT standard](https://book.clarity-lang.org/ch10-01-sip009-nft-standard.html)
- [Creating a SIP009 NFT](https://book.clarity-lang.org/ch10-02-creating-a-sip009-nft.html)
