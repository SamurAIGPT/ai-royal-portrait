"use client";

import { useSession, signIn } from "next-auth/react";
import { useState } from "react";
import Navbar from "@/components/Navbar";
import { useSearchParams } from "next/navigation";
import {
  FaCrown,
  FaCheckCircle,
  FaCoins,
  FaSpinner,
  FaGoogle,
  FaBolt,
} from "react-icons/fa";
import { Suspense } from "react";

const PLANS = [
  {
    id: "basic",
    name: "Basic Pack",
    credits: 1000,
    price: 5,
    priceInCents: 500,
    portraits: 500,
    badge: null,
    accent: "zinc",
    features: ["1,000 Credits", "~500 Royal Portraits", "All 20 Styles", "HD Downloads"],
  },
  {
    id: "standard",
    name: "Standard Pack",
    credits: 2000,
    price: 10,
    priceInCents: 1000,
    portraits: 1000,
    badge: "Popular",
    accent: "yellow",
    features: ["2,000 Credits", "~1,000 Royal Portraits", "All 20 Styles", "HD Downloads", "Priority Support"],
  },
  {
    id: "pro",
    name: "Pro Pack",
    credits: 4000,
    price: 20,
    priceInCents: 2000,
    portraits: 2000,
    badge: "Best Value",
    accent: "yellow",
    features: ["4,000 Credits", "~2,000 Royal Portraits", "All 20 Styles", "HD Downloads", "Priority Support"],
  },
  {
    id: "business",
    name: "Business Pack",
    credits: 10000,
    price: 50,
    priceInCents: 5000,
    portraits: 5000,
    badge: "Enterprise",
    accent: "zinc",
    features: ["10,000 Credits", "~5,000 Royal Portraits", "All 20 Styles", "HD Downloads", "Priority Support", "Bulk Discount"],
  },
];

function PricingContent() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const success = searchParams.get("success");
  const canceled = searchParams.get("canceled");
  const [loading, setLoading] = useState(null);

  const handleCheckout = async (planId) => {
    if (!session?.user) { signIn("google"); return; }
    setLoading(planId);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });
      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch {
      alert("Failed to start checkout. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-10">
        {/* Success/Canceled Banners */}
        {success && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center gap-3">
            <FaCheckCircle />
            <div>
              <p className="text-sm font-semibold">Payment successful!</p>
              <p className="text-xs opacity-80">Credits have been added to your account.</p>
            </div>
          </div>
        )}
        {canceled && (
          <div className="mb-6 p-4 rounded-2xl bg-zinc-800 border border-zinc-700 text-zinc-400 text-sm">
            Payment was canceled. You can try again anytime.
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs font-semibold mb-4">
            <FaBolt className="text-[10px]" />
            One-Time Purchase · No Subscription
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">
            Get Your <span className="text-gradient-gold">Credits</span>
          </h1>
          <p className="text-zinc-400 text-sm max-w-md mx-auto">
            Each royal portrait costs just <strong className="text-yellow-400">2 credits ($0.01)</strong>. Buy once, use anytime. Credits never expire.
          </p>
          {session?.user && (
            <div className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-sm">
              <FaCoins className="text-yellow-500 text-xs" />
              <span className="text-zinc-400">Your balance:</span>
              <span className="text-yellow-400 font-bold">{session.user.credits} credits</span>
              <span className="text-zinc-600 text-xs">({Math.floor((session.user.credits ?? 0) / 2)} portraits remaining)</span>
            </div>
          )}
        </div>

        {/* Plans grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PLANS.map((plan) => {
            const isPopular = plan.badge === "Popular";
            return (
              <div
                key={plan.id}
                className={`relative rounded-3xl p-5 flex flex-col border transition-all hover:scale-[1.02] ${
                  isPopular
                    ? "bg-gradient-to-b from-yellow-500/10 to-zinc-900 border-yellow-500/40 shadow-xl shadow-yellow-500/5 glow-gold"
                    : "bg-zinc-900 border-zinc-800 hover:border-zinc-700"
                }`}
              >
                {plan.badge && (
                  <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold ${
                    isPopular ? "bg-yellow-500 text-zinc-950" : "bg-zinc-700 text-zinc-300"
                  }`}>
                    {plan.badge}
                  </div>
                )}

                <div className="mb-4">
                  <h2 className="text-base font-bold text-zinc-200">{plan.name}</h2>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-3xl font-extrabold text-white">${plan.price}</span>
                    <span className="text-zinc-500 text-sm">one-time</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-2">
                    <FaCoins className="text-yellow-500 text-xs" />
                    <span className="text-yellow-400 font-semibold text-sm">{plan.credits.toLocaleString()} Credits</span>
                    <span className="text-zinc-600 text-xs">= {plan.portraits.toLocaleString()} portraits</span>
                  </div>
                </div>

                <ul className="flex flex-col gap-2 mb-5 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-xs text-zinc-400">
                      <FaCheckCircle className="text-emerald-500 text-[10px] shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>

                <button
                  id={`checkout-${plan.id}-btn`}
                  onClick={() => handleCheckout(plan.id)}
                  disabled={loading === plan.id}
                  className={`w-full py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                    isPopular
                      ? "bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-zinc-950 shadow-lg hover:shadow-yellow-500/25"
                      : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 hover:border-zinc-600"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {loading === plan.id ? (
                    <><FaSpinner className="animate-spin text-xs" /> Processing…</>
                  ) : !session ? (
                    <><FaGoogle className="text-xs" /> Sign in to Buy</>
                  ) : (
                    <><FaCrown className="text-xs" /> Get {plan.credits.toLocaleString()} Credits</>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* FAQ */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { q: "How much is 1 portrait?", a: "Each royal portrait costs 2 credits, which is just $0.01. Incredibly affordable!" },
            { q: "Do credits expire?", a: "No! Credits are yours forever. Buy once and generate portraits whenever you like." },
            { q: "What payment methods?", a: "We accept all major credit/debit cards via Stripe's secure payment gateway." },
          ].map((faq) => (
            <div key={faq.q} className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800">
              <h3 className="text-sm font-semibold text-zinc-300 mb-2">{faq.q}</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export default function PricingPage() {
  return (
    <Suspense>
      <PricingContent />
    </Suspense>
  );
}
