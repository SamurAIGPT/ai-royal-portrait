import Stripe from "stripe";
import config from "./config";

let _stripe = null;

export function getStripe() {
  if (!_stripe) {
    if (!config.stripe.secretKey) return null;
    _stripe = new Stripe(config.stripe.secretKey, { apiVersion: "2024-06-20" });
  }
  return _stripe;
}

// Keep named export for backward compat but lazy
export const stripe = new Proxy(
  {},
  {
    get(_, prop) {
      const s = getStripe();
      if (!s) throw new Error("Stripe not configured: missing STRIPE_SECRET_KEY");
      return s[prop];
    },
  }
);

