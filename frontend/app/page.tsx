"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Waves,
  Shield,
  FileBarChart,
  Leaf,
  ArrowRight,
  CheckCircle,
  Globe,
  Lock,
  Zap,
  Users,
  Mail,
  Phone,
  Copy,
} from "lucide-react";

export default function HomePage() {
  const features = [
    {
      icon: <Leaf className="h-6 w-6" />,
      title: "Blue Carbon Projects",
      description:
        "Register and manage mangrove, seagrass, saltmarsh, and kelp forest conservation projects.",
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Blockchain Verification",
      description:
        "Immutable on-chain verification ensures transparency and trust in carbon credit issuance.",
    },
    {
      icon: <FileBarChart className="h-6 w-6" />,
      title: "MRV System",
      description:
        "Comprehensive Monitoring, Reporting, and Verification with standardized methodologies.",
    },
    {
      icon: <Globe className="h-6 w-6" />,
      title: "Global Registry",
      description:
        "Track and trade carbon credits from coastal ecosystems worldwide.",
    },
  ];

  const benefits = [
    "Transparent blockchain-based verification",
    "Real-time carbon sequestration tracking",
    "Standardized MRV methodologies",
    "Secure credit issuance and transfer",
    "Comprehensive analytics dashboard",
    "Multi-stakeholder collaboration",
  ];

  const router = useRouter();
  const [openContact, setOpenContact] = useState(false);
  const [openPrivacy, setOpenPrivacy] = useState(false);
  const [openTerms, setOpenTerms] = useState(false);
  const [openDocs, setOpenDocs] = useState(false);
  const [copied, setCopied] = useState<"email" | "phone" | null>(null);

  useEffect(() => {
    router.prefetch("/login");
    router.prefetch("/signup");
  }, [router]);

  const handleCopy = (text: string, type: "email" | "phone") => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <Waves className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">OceanLedger MRV</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="#features"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Features
            </Link>
            <Link
              href="#about"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              About
            </Link>
            <button
              onClick={() => setOpenContact(true)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              Contact
            </button>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login" prefetch>
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>
            <Link href="/signup" prefetch>
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-32">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background" />
        <div className="container relative mx-auto px-4 text-center">
          <div className="mx-auto max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm text-primary">
              <Zap className="h-4 w-4" />
              Blockchain-Powered Carbon Registry
            </div>
            <h1 className="mb-6 text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Blue Carbon Registry & MRV System
            </h1>
            <p className="mb-8 text-pretty text-lg text-muted-foreground lg:text-xl">
              A decentralized platform for registering, monitoring, and verifying
              blue carbon projects. Ensure transparency and trust in coastal
              ecosystem conservation through blockchain technology.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Link href="/signup" prefetch>
                <Button size="lg" className="gap-2">
                  Start Your Project
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link href="/demo" prefetch>
                <Button size="lg" variant="outline" className="gap-2">
                  View Demo Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y border-border bg-card py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary lg:text-4xl">237K+</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Carbon Credits Issued
              </p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-primary lg:text-4xl">13K+</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Hectares Protected
              </p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-primary lg:text-4xl">50+</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Projects Worldwide
              </p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-primary lg:text-4xl">100%</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Blockchain Verified
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
              Comprehensive Carbon Management
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Everything you need to register, monitor, and verify blue carbon
              projects on the blockchain.
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <Card
                key={feature.title}
                className="border-border bg-card hover:border-primary/50 transition-colors"
              >
                <CardContent className="p-6">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    {feature.icon}
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-foreground">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="about" className="border-t border-border bg-card py-20">
        <div className="container mx-auto px-4">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
                Why Choose BlueCarbon Registry?
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Our platform combines cutting-edge blockchain technology with
                established MRV methodologies to create a trusted ecosystem for
                blue carbon projects.
              </p>
              <ul className="mt-8 space-y-4">
                {benefits.map((benefit) => (
                  <li key={benefit} className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-primary" />
                    <span className="text-foreground">{benefit}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <Link href="/signup">
                  <Button className="gap-2">
                    Get Started Today
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Card className="border-border bg-secondary/30 p-6">
                <Lock className="mb-4 h-8 w-8 text-primary" />
                <h3 className="mb-2 font-semibold text-foreground">
                  Secure & Immutable
                </h3>
                <p className="text-sm text-muted-foreground">
                  All data is securely stored on the blockchain, ensuring
                  tamper-proof records.
                </p>
              </Card>
              <Card className="border-border bg-secondary/30 p-6">
                <Zap className="mb-4 h-8 w-8 text-primary" />
                <h3 className="mb-2 font-semibold text-foreground">
                  Fast Verification
                </h3>
                <p className="text-sm text-muted-foreground">
                  Automated verification processes reduce time-to-market for
                  carbon credits.
                </p>
              </Card>
              <Card className="border-border bg-secondary/30 p-6">
                <Users className="mb-4 h-8 w-8 text-primary" />
                <h3 className="mb-2 font-semibold text-foreground">
                  Community Driven
                </h3>
                <p className="text-sm text-muted-foreground">
                  Engage local communities in conservation efforts with
                  transparent benefits.
                </p>
              </Card>
              <Card className="border-border bg-secondary/30 p-6">
                <Globe className="mb-4 h-8 w-8 text-primary" />
                <h3 className="mb-2 font-semibold text-foreground">
                  Global Reach
                </h3>
                <p className="text-sm text-muted-foreground">
                  Connect with buyers and investors from around the world
                  through our marketplace.
                </p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="rounded-2xl bg-gradient-to-r from-primary/20 to-teal-500/20 p-8 lg:p-12">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
                Ready to Make an Impact?
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Join the growing community of blue carbon project developers,
                verifiers, and investors on our blockchain-powered platform.
              </p>
              <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
                <Link href="/signup">
                  <Button size="lg" className="gap-2">
                    Create Your Account
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="lg" variant="outline">
                    Sign In
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                <Waves className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold text-foreground">
                BlueCarbon Registry
              </span>
            </div>
            <nav className="flex flex-wrap items-center justify-center gap-6">
              <button
                onClick={() => setOpenPrivacy(true)}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                Privacy Policy
              </button>
              <button
                onClick={() => setOpenTerms(true)}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                Terms of Service
              </button>
              <button
                onClick={() => setOpenDocs(true)}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                Documentation
              </button>
              <button
                onClick={() => setOpenContact(true)}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                Contact
              </button>
            </nav>
          </div>
          <div className="mt-8 border-t border-border pt-8 text-center text-sm text-muted-foreground">
            <p>
              Blockchain-based Blue Carbon Registry and MRV System
            </p>
          </div>
        </div>
      </footer>

      {/* Contact Dialog */}
      <Dialog open={openContact} onOpenChange={setOpenContact}>
        <DialogContent className="max-w-md sm:rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-2xl">Get In Touch</DialogTitle>
            <DialogDescription>
              Have questions? We'd love to hear from you. Reach out to us using any of the methods below.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-6">
            {/* Email Section */}
            <div className="group rounded-lg border border-border bg-card/50 p-4 transition-all hover:bg-card hover:border-primary/40">
              <div className="flex items-start gap-4">
                <div className="mt-1 rounded-lg bg-primary/10 p-3">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <p className="mt-1 text-lg font-semibold text-foreground">
                    oceanledgermrv@gmail.com
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 h-8 gap-2 text-xs"
                    onClick={() =>
                      handleCopy("oceanledgermrv@gmail.com", "email")
                    }
                  >
                    <Copy className="h-3.5 w-3.5" />
                    {copied === "email" ? "Copied!" : "Copy Email"}
                  </Button>
                </div>
              </div>
            </div>

            {/* Phone Section */}
            <div className="group rounded-lg border border-border bg-card/50 p-4 transition-all hover:bg-card hover:border-primary/40">
              <div className="flex items-start gap-4">
                <div className="mt-1 rounded-lg bg-primary/10 p-3">
                  <Phone className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">Phone</p>
                  <p className="mt-1 text-lg font-semibold text-foreground">
                    +91-912365****
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 h-8 gap-2 text-xs"
                    onClick={() => handleCopy("+91-912365****", "phone")}
                  >
                    <Copy className="h-3.5 w-3.5" />
                    {copied === "phone" ? "Copied!" : "Copy Number"}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <Button
              onClick={() => setOpenContact(false)}
              className="w-full"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Privacy Policy Dialog */}
      <Dialog open={openPrivacy} onOpenChange={setOpenPrivacy}>
        <DialogContent className="max-w-2xl max-h-[70vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Privacy Policy</DialogTitle>
            <DialogDescription>
              Last updated: March 2026
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 text-sm text-foreground">
            <div>
              <h3 className="font-semibold text-base mb-2">1. Introduction</h3>
              <p className="text-muted-foreground">
                BlueCarbon Registry ("we", "us", "our") operates the OceanLedger MRV website. This page informs you of our policies regarding the collection, use, and disclosure of personal data when you use our Service and the choices you have associated with that data.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-base mb-2">2. Information Collection</h3>
              <p className="text-muted-foreground">
                We collect information for various purposes to provide and improve our Service to you. This may include account information, project details, verification documents, and blockchain transaction data.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-base mb-2">3. Data Security</h3>
              <p className="text-muted-foreground">
                The security of your data is important to us but remember that no method of transmission over the Internet is 100% secure. While we strive to use commercially acceptable means to protect your personal data, we cannot guarantee its absolute security. Data is secured using blockchain technology with cryptographic verification.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-base mb-2">4. Your Rights</h3>
              <p className="text-muted-foreground">
                You have the right to access, update, or delete information about yourself. You can contact us at oceanledgermrv@gmail.com to exercise these rights.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-base mb-2">5. Contact Us</h3>
              <p className="text-muted-foreground">
                If you have any questions about this Privacy Policy, please contact us at oceanledgermrv@gmail.com or call +91-912365****.
              </p>
            </div>
          </div>

          <div className="border-t border-border mt-6 pt-4">
            <Button
              onClick={() => setOpenPrivacy(false)}
              className="w-full"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Terms of Service Dialog */}
      <Dialog open={openTerms} onOpenChange={setOpenTerms}>
        <DialogContent className="max-w-2xl max-h-[70vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Terms of Service</DialogTitle>
            <DialogDescription>
              Last updated: March 2026
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 text-sm text-foreground">
            <div>
              <h3 className="font-semibold text-base mb-2">1. Acceptance of Terms</h3>
              <p className="text-muted-foreground">
                By accessing and using BlueCarbon Registry, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-base mb-2">2. User Responsibilities</h3>
              <p className="text-muted-foreground">
                Users are responsible for maintaining the confidentiality of their account information and passwords. You agree to accept responsibility for all activities that occur under your account. You must notify us immediately of any unauthorized use.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-base mb-2">3. Intellectual Property</h3>
              <p className="text-muted-foreground">
                The Platform and its entire contents, features, and functionality (including but not limited to all information, software, text, displays, images, video, and audio) are owned by BlueCarbon Registry, its licensors, or other providers of such material.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-base mb-2">4. Limitation of Liability</h3>
              <p className="text-muted-foreground">
                In no event shall BlueCarbon Registry, nor its directors, employees, or agents, be liable to you for any direct, indirect, incidental, special, punitive, or consequential damages whatsoever resulting from any loss which by way of example, but not limitation, includes loss of profits, loss of data or business interruption.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-base mb-2">5. Governing Law</h3>
              <p className="text-muted-foreground">
                These terms and conditions are governed by and construed in accordance with the laws of India, and you irrevocably submit to the exclusive jurisdiction of the courts located in India.
              </p>
            </div>
          </div>

          <div className="border-t border-border mt-6 pt-4">
            <Button
              onClick={() => setOpenTerms(false)}
              className="w-full"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Documentation Dialog */}
      <Dialog open={openDocs} onOpenChange={setOpenDocs}>
        <DialogContent className="max-w-2xl max-h-[70vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Documentation</DialogTitle>
            <DialogDescription>
              Technical guides and API documentation
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 text-sm">
            <div className="rounded-lg bg-card/50 border border-border p-4">
              <h3 className="font-semibold text-base mb-2 text-foreground">📖 Getting Started</h3>
              <p className="text-muted-foreground">
                Learn how to register your first blue carbon project. Our step-by-step guide will walk you through the entire process from project creation to verification.
              </p>
            </div>

            <div className="rounded-lg bg-card/50 border border-border p-4">
              <h3 className="font-semibold text-base mb-2 text-foreground">🔗 Blockchain Integration</h3>
              <p className="text-muted-foreground">
                Understand how our blockchain verification works. We use Ethereum smart contracts to ensure immutable carbon credit issuance and transfer.
              </p>
            </div>

            <div className="rounded-lg bg-card/50 border border-border p-4">
              <h3 className="font-semibold text-base mb-2 text-foreground">📊 MRV Methodology</h3>
              <p className="text-muted-foreground">
                Comprehensive Monitoring, Reporting, and Verification standards. We follow international guidelines for blue carbon ecosystem monitoring and verification.
              </p>
            </div>

            <div className="rounded-lg bg-card/50 border border-border p-4">
              <h3 className="font-semibold text-base mb-2 text-foreground">🔐 Security Guidelines</h3>
              <p className="text-muted-foreground">
                Best practices for securing your account and protecting your project data. Use strong passwords and enable two-factor authentication for enhanced security.
              </p>
            </div>

            <div className="rounded-lg bg-card/50 border border-border p-4">
              <h3 className="font-semibold text-base mb-2 text-foreground">💬 API Reference</h3>
              <p className="text-muted-foreground">
                Complete API documentation for developers. Access endpoints to create, read, update, and delete projects programmatically.
              </p>
            </div>
          </div>

          <div className="border-t border-border mt-6 pt-4">
            <Button
              onClick={() => setOpenDocs(false)}
              className="w-full"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
