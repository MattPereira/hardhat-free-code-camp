// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

// 1. `listItem`: List NFTs on the marketplace
// 2. `buyItem`: Buy NFTs from the marketplace
// 3. `cancelItem`: Cancel a listing
// 4. `updateListing`: Update price
// 5. `withdrawProceeds`: Withdraw payment for my bought NFTs

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

error NftMarketPlace__PriceMustBeAboveZero();
error NftMarketPlace__NotApprovedForMarketplace();
error NftMarketPlace__AlreadyListed(address nftAddress, uint256 tokenId);
error NftMarketPlace__NotListed(address nftAddress, uint256 tokenId);
error NftMarketPlace__NotOWner();
error NftMarketPlace__PriceNotMet(address nftAddress, uint256 tokenId, uint256 price);

contract NftMarketplace {
    // TYPES
    struct Listing {
        uint256 price;
        address seller;
    }

    // EVENTS
    event ItemListed(address indexed seller, address indexed nftAddress, uint256 indexed tokenId, uint256 price);
    event ItemBought(address indexed buyer, address indexed nftAddress, uint256 indexed tokenId, uint256 price);

    // NFT Contract address -> NFT Token ID -> Listing
    mapping(address => mapping(uint256 => Listing)) private s_listings;
    // Seller address -> Amount earned
    mapping(address => uint256) private s_proceeds;

    /////////////////
    // Modifiers  //
    ///////////////
    modifier notListed(address nftAddress, uint256 tokenId, address owner) {
        Listing memory listing = s_listings[nftAddress][tokenId];
        if (listing.price > 0) {
            revert NftMarketPlace__AlreadyListed(nftAddress, tokenId);
        }
        _;
    }

    modifier isOwner(address nftAddress, uint256 tokenId, address spender) {
        IERC721 nft = IERC721(nftAddress);
        address owner = nft.ownerOf(tokenId);
        if (owner != spender) {
            revert NftMarketPlace__NotOWner();
        }
        _;
    }

    modifier isListed(address nftAddress, uint256 tokenId) {
        Listing memory listing = s_listings[nftAddress][tokenId];
        if (listing.price <= 0) {
            revert NftMarketPlace__NotListed(nftAddress, tokenId);
        }
        _;
    }

    /////////////////////
    // Main Functions //
    ///////////////////

    /**
     * @notice Method for listing your NFT on the marketplace
     * @param nftAddress: Address of the NFT
     * @param tokenId: ID of the NFT
     * @param price: sale price of the listed NFT
     * @dev Technically, we could have the contract be the escrow for the NFTs,
     * but this way people can still hold their NFTS when listed
     */
    function listItem(address nftAddress, uint256 tokenId, uint256 price)
        external
        notListed(nftAddress, tokenId, msg.sender)
        isOwner(nftAddress, tokenId, msg.sender)
    // Challenge: Have this contract accept payment in a subset of tokens
    // Hint: Use Chainlink Price Feeds to convert the price of the tokens between eachother
    {
        if (price <= 0) {
            revert NftMarketPlace__PriceMustBeAboveZero();
        }
        IERC721 nft = IERC721(nftAddress);
        if (nft.getApproved(tokenId) != address(this)) {
            revert NftMarketPlace__NotApprovedForMarketplace();
        }
        s_listings[nftAddress][tokenId] = Listing(price, msg.sender);
        emit ItemListed(msg.sender, nftAddress, tokenId, price);
    }

    function buyItem(address nftAddress, uint256 tokenId) external payable isListed(nftAddress, tokenId) {
        Listing memory listedItem = s_listings[nftAddress][tokenId];
        if (msg.value < listedItem.price) {
            revert NftMarketPlace__PriceNotMet(nftAddress, tokenId, listedItem.price);
        }
        // Why don't we just send the seller the money?
        // because the send could fail -> https://fravoll.github.io/solidity-patterns/pull_over_push.html
        s_proceeds[listedItem.seller] = s_proceeds[listedItem.seller] + msg.value;
        delete (s_listings[nftAddress][tokenId]);
        IERC721(nftAddress).safeTransferFrom(listedItem.seller, msg.sender, tokenId);
        // check to make sure NFT was transferred
        emit ItemBought(msg.sender, nftAddress, tokenId, listedItem.price);
    }
}
