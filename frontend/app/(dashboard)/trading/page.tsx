"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Plus,
  Send,
  CheckCircle,
  Clock,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Trade {
  _id: string;
  tradeId: string;
  creditAmount: number;
  pricePerCredit: number;
  totalPrice: number;
  status: "active" | "completed" | "cancelled";
  sellerId: {
    _id: string;
    name: string;
    email: string;
  };
  buyerId?: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  notes?: string;
  transactionHash?: string;
}

interface MarketplaceStats {
  totalActive: number;
  avgPrice: number;
  totalCreditsAvailable: number;
}

export default function TradingPage() {
  const [listings, setListings] = useState<Trade[]>([]);
  const [userTrades, setUserTrades] = useState<Trade[]>([]);
  const [stats, setStats] = useState<MarketplaceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"marketplace" | "my-trades">("marketplace");
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Form states
  const [creditAmount, setCreditAmount] = useState("");
  const [pricePerCredit, setPricePerCredit] = useState("");
  const [notes, setNotes] = useState("");
  const [isCreatingListing, setIsCreatingListing] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [buyAmount, setBuyAmount] = useState("");
  const [isBuying, setIsBuying] = useState(false);
  const [createListingOpen, setCreateListingOpen] = useState(false);

  // Get current user
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    setCurrentUser(user);
  }, []);

  // Fetch marketplace listings
  const fetchMarketplace = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/trading/marketplace`
      );
      const data = await response.json();
      setListings(data.listings);
      setStats(data.stats);
    } catch (error) {
      console.error("Error fetching marketplace:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch user's trades
  const fetchUserTrades = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      
      // Get listings where user is seller
      const sellListingsRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/trading/marketplace`
      );
      const allTrades = await sellListingsRes.json();
      const userListings = allTrades.listings.filter(
        (t: Trade) => t.sellerId._id === user.id
      );
      setUserTrades(userListings);
    } catch (error) {
      console.error("Error fetching user trades:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "marketplace") {
      fetchMarketplace();
    } else {
      fetchUserTrades();
    }
  }, [activeTab]);

  // Create listing
  const handleCreateListing = async () => {
    if (!creditAmount || !pricePerCredit) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      setIsCreatingListing(true);
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/trading/listings`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            creditAmount: parseFloat(creditAmount),
            pricePerCredit: parseFloat(pricePerCredit),
            notes,
          }),
        }
      );

      if (response.ok) {
        alert("✅ Listing created successfully!");
        setCreditAmount("");
        setPricePerCredit("");
        setNotes("");
        setCreateListingOpen(false);
        fetchMarketplace();
      } else {
        alert("Failed to create listing");
      }
    } catch (error) {
      console.error("Error creating listing:", error);
      alert("Error creating listing");
    } finally {
      setIsCreatingListing(false);
    }
  };

  // Buy credits
  const handleBuyCredits = async (trade: Trade) => {
    if (!buyAmount || parseFloat(buyAmount) <= 0) {
      alert("Enter valid amount");
      return;
    }

    try {
      setIsBuying(true);
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/trading/listings/${trade._id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        alert("✅ Purchase completed successfully!");
        setBuyAmount("");
        setSelectedTrade(null);
        fetchMarketplace();
        fetchUserTrades();
      } else {
        alert("Failed to purchase credits");
      }
    } catch (error) {
      console.error("Error buying credits:", error);
      alert("Error buying credits");
    } finally {
      setIsBuying(false);
    }
  };

  const totalMarketValue = stats ? stats.totalCreditsAvailable * stats.avgPrice : 0;

  return (
    <div className="min-h-screen">
      <Header
        title="Carbon Credit Marketplace"
        description="Buy and sell verified carbon credits"
      />

      <div className="p-4 sm:p-6 space-y-6">
        {/* Marketplace Stats */}
        {stats && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Active Listings</p>
                    <p className="text-3xl font-bold text-foreground mt-1">
                      {stats.totalActive}
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <BarChart3 className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Avg. Price</p>
                    <p className="text-3xl font-bold text-green-600 mt-1">
                      ₹{stats.avgPrice.toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">per credit in INR</p>
                  </div>
                  <div className="h-12 w-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-green-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Market Value</p>
                    <p className="text-3xl font-bold text-teal-600 mt-1">
                      ₹{totalMarketValue.toFixed(0)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {stats.totalCreditsAvailable} credits available
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-lg bg-teal-500/10 flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-teal-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <TabsList className="bg-secondary">
              <TabsTrigger value="marketplace" className="gap-2">
                <ShoppingCart className="h-4 w-4" />
                Marketplace
                <Badge variant="secondary" className="ml-1">
                  {listings.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="my-trades" className="gap-2">
                <Send className="h-4 w-4" />
                My Listings
                <Badge variant="secondary" className="ml-1">
                  {userTrades.length}
                </Badge>
              </TabsTrigger>
            </TabsList>

            {activeTab === "my-trades" && (
              <Dialog open={createListingOpen} onOpenChange={setCreateListingOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Create Listing
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-card border-border">
                  <DialogHeader>
                    <DialogTitle>Create Sell Listing</DialogTitle>
                    <DialogDescription>
                      List your verified carbon credits on the marketplace
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="amount">Credits to Sell *</Label>
                      <Input
                        id="amount"
                        type="number"
                        placeholder="e.g. 100"
                        value={creditAmount}
                        onChange={(e) => setCreditAmount(e.target.value)}
                        disabled={isCreatingListing}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="price">Price per Credit (INR) *</Label>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <Input
                          id="price"
                          type="number"
                          placeholder="e.g. 25.50"
                          step="0.01"
                          value={pricePerCredit}
                          onChange={(e) => setPricePerCredit(e.target.value)}
                          disabled={isCreatingListing}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="notes">Notes (Optional)</Label>
                      <Textarea
                        id="notes"
                        placeholder="e.g. High-quality verified credits from mangrove restoration project..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        disabled={isCreatingListing}
                        rows={3}
                      />
                    </div>

                    {creditAmount && pricePerCredit && (
                      <Card className="bg-secondary/50 border-border">
                        <CardContent className="p-4">
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Credits:</span>
                              <span className="font-medium">{creditAmount}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Price/Credit:</span>
                              <span className="font-medium">₹{parseFloat(pricePerCredit || "0").toFixed(2)}</span>
                            </div>
                            <div className="border-t border-border pt-2 flex justify-between">
                              <span className="font-medium">Total Value:</span>
                              <span className="font-bold text-green-600">
                                ₹{(parseFloat(creditAmount || "0") * parseFloat(pricePerCredit || "0")).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    <Button
                      onClick={handleCreateListing}
                      disabled={isCreatingListing || !creditAmount || !pricePerCredit}
                      className="w-full"
                    >
                      {isCreatingListing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        "Create Listing"
                      )}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {/* Marketplace Tab */}
          <TabsContent value="marketplace" className="mt-6 space-y-6">
            {loading ? (
              <Card className="bg-card border-border">
                <CardContent className="p-12 text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto" />
                  <p className="text-muted-foreground mt-4">Loading marketplace...</p>
                </CardContent>
              </Card>
            ) : listings.length === 0 ? (
              <Card className="bg-card border-border">
                <CardContent className="p-12 text-center">
                  <ShoppingCart className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
                  <p className="text-muted-foreground font-medium">No listings available</p>
                  <p className="text-sm text-muted-foreground mt-1">Check back later for available credits</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {listings.map((listing) => (
                  <Card key={listing._id} className="bg-card border-border hover:border-primary/50 transition-colors">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base">{listing.sellerId.name}</CardTitle>
                          <p className="text-xs text-muted-foreground mt-1">
                            {listing.sellerId.email}
                          </p>
                        </div>
                        <Badge className="bg-green-500/20 text-green-600 border-green-500/50">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="p-3 bg-secondary/50 rounded-lg">
                          <p className="text-xs text-muted-foreground">Available</p>
                          <p className="text-lg font-bold text-foreground">
                            {listing.creditAmount}
                          </p>
                          <p className="text-xs text-muted-foreground">credits</p>
                        </div>
                        <div className="p-3 bg-secondary/50 rounded-lg">
                          <p className="text-xs text-muted-foreground">Price</p>
                          <p className="text-lg font-bold text-green-600">
                            ₹{listing.pricePerCredit.toFixed(2)}
                          </p>
                          <p className="text-xs text-muted-foreground">per credit in INR</p>
                        </div>
                        <div className="p-3 bg-secondary/50 rounded-lg">
                          <p className="text-xs text-muted-foreground">Total</p>
                          <p className="text-lg font-bold text-teal-600">
                            ₹{listing.totalPrice.toFixed(0)}
                          </p>
                        </div>
                      </div>

                      {listing.notes && (
                        <div className="p-3 bg-secondary/30 rounded-lg border border-border">
                          <p className="text-xs text-muted-foreground mb-1">Notes</p>
                          <p className="text-sm text-foreground">{listing.notes}</p>
                        </div>
                      )}

                      <Dialog>
                        <DialogTrigger asChild>
                          <Button className="w-full gap-2">
                            <ShoppingCart className="h-4 w-4" />
                            Buy Credits
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-card border-border">
                          <DialogHeader>
                            <DialogTitle>Buy Carbon Credits</DialogTitle>
                            <DialogDescription>
                              From {listing.sellerId.name}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="p-4 bg-secondary/50 rounded-lg border border-border">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <p className="text-xs text-muted-foreground">Available</p>
                                  <p className="text-xl font-bold text-foreground">
                                    {listing.creditAmount}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">Price/Credit</p>
                                  <p className="text-xl font-bold text-green-600">
                                    ₹{listing.pricePerCredit.toFixed(2)}
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="buy-amount">Credits to Buy *</Label>
                              <Input
                                id="buy-amount"
                                type="number"
                                placeholder={`Max: ${listing.creditAmount}`}
                                value={buyAmount}
                                onChange={(e) => setBuyAmount(e.target.value)}
                                disabled={isBuying}
                                max={listing.creditAmount}
                              />
                            </div>
                            {buyAmount && parseFloat(buyAmount) > 0 && (
                              <Card className="bg-green-500/10 border-green-500/30">
                                <CardContent className="p-4">
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm text-foreground">Total Cost:</span>
                                    <span className="text-lg font-bold text-green-600">
                                      ₹{(parseFloat(buyAmount) * listing.pricePerCredit).toFixed(2)}
                                    </span>
                                  </div>
                                </CardContent>
                              </Card>
                            )}
                            <Button
                              onClick={() => handleBuyCredits(listing)}
                              disabled={isBuying || !buyAmount || parseFloat(buyAmount) <= 0}
                              className="w-full"
                            >
                              {isBuying ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Processing...
                                </>
                              ) : (
                                "Confirm Purchase"
                              )}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* My Trades Tab */}
          <TabsContent value="my-trades" className="mt-6 space-y-6">
            {loading ? (
              <Card className="bg-card border-border">
                <CardContent className="p-12 text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto" />
                  <p className="text-muted-foreground mt-4">Loading your listings...</p>
                </CardContent>
              </Card>
            ) : userTrades.length === 0 ? (
              <Card className="bg-card border-border">
                <CardContent className="p-12 text-center">
                  <Send className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
                  <p className="text-muted-foreground font-medium">No listings yet</p>
                  <p className="text-sm text-muted-foreground mt-1">Create your first listing to get started</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {userTrades.map((trade) => (
                  <Card key={trade._id} className="bg-card border-border">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base">Listing {trade.tradeId}</CardTitle>
                          <p className="text-xs text-muted-foreground mt-1">
                            Created{" "}
                            {new Date(trade.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge
                          className={cn(
                            trade.status === "active" &&
                              "bg-green-500/20 text-green-600 border-green-500/50",
                            trade.status === "completed" &&
                              "bg-blue-500/20 text-blue-600 border-blue-500/50",
                            trade.status === "cancelled" &&
                              "bg-red-500/20 text-red-600 border-red-500/50"
                          )}
                        >
                          {trade.status === "active" && (
                            <Clock className="h-3 w-3 mr-1" />
                          )}
                          {trade.status === "completed" && (
                            <CheckCircle className="h-3 w-3 mr-1" />
                          )}
                          {trade.status.charAt(0).toUpperCase() +
                            trade.status.slice(1)}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-3 gap-3">
                        <div className="p-3 bg-secondary/50 rounded-lg">
                          <p className="text-xs text-muted-foreground">Credits</p>
                          <p className="text-base font-bold text-foreground">
                            {trade.creditAmount}
                          </p>
                        </div>
                        <div className="p-3 bg-secondary/50 rounded-lg">
                          <p className="text-xs text-muted-foreground">Price</p>
                          <p className="text-base font-bold text-green-600">
                            ₹{trade.pricePerCredit}
                          </p>
                        </div>
                        <div className="p-3 bg-secondary/50 rounded-lg">
                          <p className="text-xs text-muted-foreground">Total</p>
                          <p className="text-base font-bold text-teal-600">
                            ₹{trade.totalPrice}
                          </p>
                        </div>
                      </div>
                      {trade.status === "completed" && trade.buyerId && (
                        <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/30">
                          <p className="text-xs text-muted-foreground mb-1">Buyer</p>
                          <p className="text-sm font-medium text-foreground">
                            {trade.buyerId.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {trade.buyerId.email}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
