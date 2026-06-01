const express = require("express");
const router = express.Router();
const tradingController = require("../controllers/tradingController");
const authMiddleware = require("../middleware/authMiddleware");

// Create a new sell listing
router.post("/listings", authMiddleware, tradingController.createListing);

// Get marketplace listings (public, no auth needed)
router.get("/marketplace", tradingController.getMarketplace);

// Buy credits from a listing
router.post("/listings/:listingId/buy", authMiddleware, tradingController.buyCredits);

// Cancel a listing (by seller)
router.put("/listings/:listingId/cancel", authMiddleware, tradingController.cancelListing);

// Get user's trades (sales and purchases)
router.get("/my-trades", authMiddleware, tradingController.getUserTrades);

// Get details of a specific trade
router.get("/trades/:tradeId", authMiddleware, tradingController.getTradeDetails);

module.exports = router;
