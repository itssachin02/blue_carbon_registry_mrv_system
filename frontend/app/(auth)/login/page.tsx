"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Waves,
  Mail,
  Lock,
  Loader2,
  Eye,
  EyeOff,
  Wallet,
  Shield,
  AlertTriangle,
} from "lucide-react";
import { isMetaMaskInstalled, requestAccount, getCurrentAccount, switchToPolygonMumbai } from "@/lib/web3";
import { toast } from "@/hooks/use-toast";
import { checkServerHealth, apiRequest } from "@/lib/api-client";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [walletLoading, setWalletLoading] = useState(false);
  const [serverStatus, setServerStatus] = useState<"checking" | "online" | "offline">("checking");
  const [serverError, setServerError] = useState<string>("");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [errors, setErrors] = useState<{ email?: string; password?: string; wallet?: string }>({});

  // Check server health on page load
  useEffect(() => {
    const checkServer = async () => {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!apiUrl) {
        setServerStatus("offline");
        setServerError("API URL not configured in .env.local");
        return;
      }

      const status = await checkServerHealth(apiUrl);
      if (status.isOnline) {
        setServerStatus("online");
        setServerError("");
      } else {
        setServerStatus("offline");
        setServerError(status.message);
      }
    };

    // Clear wallet state on login page load
    localStorage.removeItem('walletAddress');
    setWalletAddress(null);

    checkServer();
  }, [router]);

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const connectWallet = async () => {
    setWalletLoading(true);
    setErrors({});

    try {
      if (!isMetaMaskInstalled()) {
        setErrors({ wallet: "No Ethereum wallet detected. Install MetaMask or another supported wallet extension." });
        return;
      }

      const account = await requestAccount();
      setWalletAddress(account);
      localStorage.setItem("walletAddress", account);
      
      // Switch to Polygon Mumbai
      await switchToPolygonMumbai();

      toast({
        title: "Wallet Connected",
        description: `Connected to ${account.slice(0, 6)}...${account.slice(-4)} on Polygon Mumbai`,
      });

      router.push("/dashboard");
    } catch (error: any) {
      console.error("Wallet connection error:", error);
      setErrors({ wallet: error.message || "Failed to connect wallet" });
    } finally {
      setWalletLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    // Check server before attempting login
    if (serverStatus === "offline") {
      toast({
        title: "Server Not Available",
        description: "Cannot reach backend server. Please check if it's running.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error, status } = await apiRequest("/api/auth/login", {
        method: "POST",
        body: {
          email: formData.email,
          password: formData.password,
        },
      });

      if (data) {
        // Login successful
        localStorage.setItem('token', data.token);
        const userData = {
          ...data.user,
          id: data.user._id || data.user.id,
        };
        localStorage.setItem('user', JSON.stringify(userData));

        toast({
          title: "Login Successful! ✅",
          description: "Redirecting to dashboard...",
        });

        router.push("/dashboard");
      } else {
        // Handle login error
        const userFriendlyError = 
          status === 400 ? "Invalid email or password" :
          status === 404 ? "User not found. Please sign up first." :
          error || "Login failed. Please try again.";

        setErrors({ email: userFriendlyError });
        toast({
          title: "Login Failed",
          description: userFriendlyError,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Login error:", error);
      setErrors({ email: "An unexpected error occurred. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />
      
      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
            <Waves className="h-7 w-7 text-primary-foreground" />
          </div>
          <span className="text-2xl font-bold text-foreground">BlueCarbon</span>
        </div>

        {/* Server Status Alert */}
        {serverStatus === "offline" && (
          <Alert className="mb-6 bg-red-500/10 border-red-500/50 text-red-600">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              {serverError || "Backend server is not responding"}
            </AlertDescription>
          </Alert>
        )}

        <Card className="border-border bg-card/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
            <p className="text-muted-foreground">
              Sign in to your account to continue
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Wallet Connection */}
            <div className="space-y-2">
              <Button
                type="button"
                variant={walletAddress ? "default" : "outline"}
                className="w-full gap-2 h-12"
                onClick={() => connectWallet()}
                disabled={walletLoading}
              >
                {walletLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Waiting for MetaMask approval...</span>
                  </>
                ) : (
                  <>
                    <Wallet className="h-5 w-5" />
                    <span>{walletAddress ? `Connected: ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : "Connect with Wallet"}</span>
                  </>
                )}
              </Button>
              {errors.wallet && (
                <p className="text-sm text-destructive">{errors.wallet}</p>
              )}
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  Or continue with email
                </span>
              </div>
            </div>

            {/* Email Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    className={`pl-9 h-11 ${errors.email ? "border-destructive" : ""}`}
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link
                    href="/forgot-password"
                    className="text-xs text-primary hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    className={`pl-9 pr-9 h-11 ${
                      errors.password ? "border-destructive" : ""
                    }`}
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-destructive">{errors.password}</p>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  checked={formData.rememberMe}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, rememberMe: checked as boolean })
                  }
                />
                <label
                  htmlFor="remember"
                  className="text-sm text-muted-foreground cursor-pointer"
                >
                  Remember me for 30 days
                </label>
              </div>

              <Button type="submit" className="w-full h-11" disabled={loading || serverStatus === "offline"}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground">
              {"Don't have an account? "}
              <Link href="/signup" className="text-primary hover:underline">
                Create account
              </Link>
            </p>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          By continuing, you agree to our{" "}
          <Link href="#" className="text-primary hover:underline">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="#" className="text-primary hover:underline">
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  );
}
