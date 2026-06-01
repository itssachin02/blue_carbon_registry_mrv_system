const CreditTrade = require("../models/CreditTrade");
const User = require("../models/user");
const { transferCreditsOnBlockchain } = require("../utils/blockchain");

// Create a sell listing
exports.createListing = async (req, res) => {
  try {
    const { creditAmount, pricePerCredit, notes } = req.body;
    const userId = req.user.id;

    const totalPrice = creditAmount * pricePerCredit;
    const tradeId = `TRADE-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    const listing = new CreditTrade({
      tradeId,
      sellerId: userId,
      creditAmount,
      pricePerCredit,
      totalPrice,
      notes,
    });

    await listing.save();

    res.json({
      success: true,
      message: "Listing created successfully",
      listing,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get marketplace listings
exports.getMarketplace = async (req, res) => {
  try {
    const { status = "active", sort = "-createdAt", limit = 50 } = req.query;

    const listings = await CreditTrade.find({ status })
      .populate("sellerId", "name email")
      .sort(sort)
      .limit(parseInt(limit));

    const stats = {
      totalActive: listings.length,
      avgPrice: listings.length > 0 ? listings.reduce((sum, l) => sum + l.pricePerCredit, 0) / listings.length : 0,
      totalCreditsAvailable: listings.reduce((sum, l) => sum + l.creditAmount, 0),
    };

    res.json({ listings, stats });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Buy credits from a listing
exports.buyCredits = async (req, res) => {
  try {
    const { listingId } = req.params;
    const userId = req.user.id;

    const listing = await CreditTrade.findById(listingId);
    if (!listing || listing.status !== "active") {
      return res.status(404).json({ error: "Listing not found or inactive" });
    }

    // Verify buyer has sufficient funds (mock check)
    const buyer = await User.findById(userId);
    if (!buyer) {
      return res.status(404).json({ error: "Buyer not found" });
    }

    // Execute blockchain transfer
    const blockchainTx = await transferCreditsOnBlockchain(
      listing.sellerId.toString(),
      userId,
      listing.creditAmount
    );

    // Update listing
    listing.buyerId = userId;
    listing.status = "completed";
    listing.completionDate = new Date();
    listing.transactionHash = blockchainTx.transactionHash;
    await listing.save();

    res.json({
      success: true,
      message: "Purchase completed successfully",
      trade: listing,
      blockchainTx,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Cancel a listing
exports.cancelListing = async (req, res) => {
  try {
    const { listingId } = req.params;
    const userId = req.user.id;

    const listing = await CreditTrade.findById(listingId);
    if (!listing) {
      return res.status(404).json({ error: "Listing not found" });
    }

    if (listing.sellerId.toString() !== userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    if (listing.status !== "active") {
      return res.status(400).json({ error: "Can only cancel active listings" });
    }

    listing.status = "cancelled";
    await listing.save();

    res.json({
      success: true,
      message: "Listing cancelled",
      listing,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get user's trades
exports.getUserTrades = async (req, res) => {
  try {
    const userId = req.user.id;

    const trades = await CreditTrade.find({
      $or: [{ sellerId: userId }, { buyerId: userId }],
    })
      .populate("sellerId", "name email")
      .populate("buyerId", "name email")
      .sort("-createdAt");

    res.json({ trades });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get trade details
exports.getTradeDetails = async (req, res) => {
  try {
    const { tradeId } = req.params;

    const trade = await CreditTrade.findById(tradeId)
      .populate("sellerId", "name email address")
      .populate("buyerId", "name email address");

    if (!trade) {
      return res.status(404).json({ error: "Trade not found" });
    }

    res.json({ trade });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
