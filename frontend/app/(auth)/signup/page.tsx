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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Waves,
  Mail,
  Lock,
  Loader2,
  Eye,
  EyeOff,
  Wallet,
  User,
  Building,
  CheckCircle,
  AlertTriangle,
  Shield,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { checkServerHealth, apiRequest } from "@/lib/api-client";

export default function SignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState(1);
  const [serverStatus, setServerStatus] = useState<"checking" | "online" | "offline">("checking");
  const [serverError, setServerError] = useState<string>("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    organization: "",
    role: "",
    agreeTerms: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

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

    checkServer();
  }, []);

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }
    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.role) {
      newErrors.role = "Please select a role";
    }
    if (!formData.agreeTerms) {
      newErrors.agreeTerms = "You must agree to the terms";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validate both steps before submission
    if (!validateStep1() || !validateStep2()) return;

    // Check server before attempting signup
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
      const { data, error, status } = await apiRequest("/api/auth/register", {
        method: "POST",
        body: {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          organization: formData.organization || undefined,
        },
      });

      if (data) {
        // Registration successful
        // Store user data locally, but do not auto-connect wallet
        localStorage.setItem('token', data.token || '');
        localStorage.setItem('user', JSON.stringify(data.user || {}));
        
        toast({
          title: "Registration Successful! ✅",
          description: "Redirecting to login...",
        });
        router.push("/login");
      } else {
        // Handle registration error
        const userFriendlyError =
          status === 400 ? error || "Invalid input provided" :
          status === 409 ? "Email already registered. Please login instead." :
          error || "Registration failed. Please try again.";

        setErrors({ submit: userFriendlyError });
        toast({
          title: "Registration Failed",
          description: userFriendlyError,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Signup error:", error);
      setErrors({ submit: "An unexpected error occurred. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = () => {
    const password = formData.password;
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  const strengthColors = ["bg-red-500", "bg-yellow-500", "bg-blue-500", "bg-green-500"];
  const strengthLabels = ["Weak", "Fair", "Good", "Strong"];

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
            <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
            <p className="text-muted-foreground">
              Join the blue carbon registry platform
            </p>
            {/* Progress Steps */}
            <div className="flex items-center justify-center gap-2 mt-4">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full ${
                  step >= 1 ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                }`}
              >
                {step > 1 ? <CheckCircle className="h-4 w-4" /> : "1"}
              </div>
              <div
                className={`h-1 w-12 rounded ${
                  step > 1 ? "bg-primary" : "bg-secondary"
                }`}
              />
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full ${
                  step >= 2 ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                }`}
              >
                2
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {step === 1 ? (
              <>
                {/* Wallet Signup */}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full gap-2 h-12"
                  disabled={loading}
                >
                  <Wallet className="h-5 w-5" />
                  Connect with Wallet
                </Button>

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

                {/* Step 1: Basic Info */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="name"
                        placeholder="Enter your full name"
                        className={`pl-9 h-11 ${errors.name ? "border-destructive" : ""}`}
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                      />
                    </div>
                    {errors.name && (
                      <p className="text-xs text-destructive">{errors.name}</p>
                    )}
                  </div>

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
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a password"
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
                    {formData.password && (
                      <div className="space-y-1">
                        <div className="flex gap-1">
                          {[0, 1, 2, 3].map((i) => (
                            <div
                              key={i}
                              className={`h-1 flex-1 rounded ${
                                i < passwordStrength()
                                  ? strengthColors[passwordStrength() - 1]
                                  : "bg-secondary"
                              }`}
                            />
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Password strength:{" "}
                          {strengthLabels[passwordStrength() - 1] || "Very Weak"}
                        </p>
                      </div>
                    )}
                    {errors.password && (
                      <p className="text-xs text-destructive">{errors.password}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="Confirm your password"
                        className={`pl-9 h-11 ${
                          errors.confirmPassword ? "border-destructive" : ""
                        }`}
                        value={formData.confirmPassword}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            confirmPassword: e.target.value,
                          })
                        }
                      />
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-xs text-destructive">
                        {errors.confirmPassword}
                      </p>
                    )}
                  </div>

                  <Button
                    type="button"
                    className="w-full h-11"
                    onClick={handleNext}
                  >
                    Continue
                  </Button>
                </div>
              </>
            ) : (
              /* Step 2: Role & Organization */
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="organization">Organization (Optional)</Label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="organization"
                      placeholder="Enter your organization"
                      className="pl-9 h-11"
                      value={formData.organization}
                      onChange={(e) =>
                        setFormData({ ...formData, organization: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) =>
                      setFormData({ ...formData, role: value })
                    }
                  >
                    <SelectTrigger
                      className={`h-11 ${errors.role ? "border-destructive" : ""}`}
                    >
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="project-owner">Project Owner</SelectItem>
                      <SelectItem value="verifier">Verifier / Auditor</SelectItem>
                      <SelectItem value="investor">Investor / Buyer</SelectItem>
                      <SelectItem value="researcher">Researcher</SelectItem>
                      <SelectItem value="government">Government Official</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.role && (
                    <p className="text-xs text-destructive">{errors.role}</p>
                  )}
                </div>

                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="terms"
                    checked={formData.agreeTerms}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, agreeTerms: checked as boolean })
                    }
                  />
                  <label
                    htmlFor="terms"
                    className="text-sm text-muted-foreground cursor-pointer leading-tight"
                  >
                    I agree to the{" "}
                    <Link href="#" className="text-primary hover:underline">
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link href="#" className="text-primary hover:underline">
                      Privacy Policy
                    </Link>
                  </label>
                </div>
                {errors.agreeTerms && (
                  <p className="text-xs text-destructive">{errors.agreeTerms}</p>
                )}

                {errors.submit && (
                  <p className="text-xs text-destructive">{errors.submit}</p>
                )}

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 h-11"
                    onClick={() => setStep(1)}
                  >
                    Back
                  </Button>
                  <Button type="submit" className="flex-1 h-11" disabled={loading || serverStatus === "offline"}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Account"
                    )}
                  </Button>
                </div>
              </form>
            )}
            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  Admin Access
                </span>
              </div>
            </div>

            <Link href="/admin/login" className="block">
              <Button
                type="button"
                variant="outline"
                className="w-full h-11 gap-2 border-red-500/30 hover:bg-red-500/10"
              >
                <Shield className="h-4 w-4" />
                Login with Admin
              </Button>
            </Link>
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
