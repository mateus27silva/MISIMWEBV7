import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import bodyParser from "body-parser";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

let stripeClient: Stripe | null = null;
function getStripeInstance() {
  if (!stripeClient) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      console.warn("⚠️ Warning: STRIPE_SECRET_KEY is not defined. Stripe endpoints will be disabled.");
      return null;
    }
    stripeClient = new Stripe(key);
  }
  return stripeClient;
}

let supabaseClient: any = null;
function getSupabaseInstance() {
  if (!supabaseClient) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      console.warn("⚠️ Warning: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not defined on the server side.");
      return null;
    }
    supabaseClient = createClient(url, key);
  }
  return supabaseClient;
}

async function startServer() {
  // Webhook endpoint needs raw body for signature verification
  app.post(
    "/api/webhook",
    bodyParser.raw({ type: "application/json" }),
    async (req, res) => {
      const sig = req.headers["stripe-signature"] as string;
      const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

      let event;

      try {
        const stripeInst = getStripeInstance();
        if (!stripeInst) {
          throw new Error("Stripe client is not initialized (missing API key)");
        }
        if (!endpointSecret) {
          throw new Error("Missing STRIPE_WEBHOOK_SECRET");
        }
        event = stripeInst.webhooks.constructEvent(req.body, sig, endpointSecret);
      } catch (err: any) {
        console.error(`❌ Webhook error: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }

      // Handle the event
      if (event.type === "checkout.session.completed") {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.client_reference_id;
        const amount = session.amount_total ? session.amount_total / 100 : 0;
        const isSubscription = session.mode === 'subscription';

        if (userId) {
          console.log(`💰 Payment received from user ${userId}: $${amount}`);
          
          const supabaseInst = getSupabaseInstance();
          if (!supabaseInst) {
            console.error("❌ Supabase client is not initialized (missing config)");
            return res.status(500).json({ error: "Database not configured on server" });
          }

          // Save donation info or update subscription status in Supabase
          const { error } = await supabaseInst
            .from('profiles')
            .update({ 
               last_payment_amount: amount,
               is_fan_club_member: true,
               updated_at: new Date().toISOString()
            })
            .eq('id', userId);

          if (error) {
            console.error("❌ Error updating profile:", error);
          } else {
             // If it was a subscription, you might want to save the subscription ID
             if (isSubscription && session.subscription) {
                await supabaseInst.from('profiles').update({
                   stripe_subscription_id: session.subscription as string
                }).eq('id', userId);
             }
          }
        }
      }

      res.json({ received: true });
    }
  );

  // Standard JSON parsing for other routes
  app.use(express.json());



  // API Route: Create Checkout Session for One-time Donation
  app.post("/api/create-fan-club-session", async (req, res) => {
    try {
      const { userId, amount, email } = req.body;

      if (!userId) {
        return res.status(400).json({ error: "Missing userId" });
      }

      const stripeInst = getStripeInstance();
      if (!stripeInst) {
        return res.status(500).json({ error: "Stripe integration is not configured on this environment." });
      }

      const session = await stripeInst.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: "Participação no Fã-clube (Doação)",
                description: "Obrigado por apoiar o MISIMWEB!",
              },
              unit_amount: Math.round(amount * 100), // convert to cents
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        customer_email: email,
        client_reference_id: userId,
        success_url: `${req.headers.origin}/settings?session_id={CHECKOUT_SESSION_ID}&donation=success`,
        cancel_url: `${req.headers.origin}/settings?donation=cancel`,
      });

      res.json({ url: session.url });
    } catch (err: any) {
      console.error("Error creating checkout session:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // API Route: Create Checkout Session for Recurring Subscription (Template for future use)
  app.post("/api/create-subscription-session", async (req, res) => {
    try {
      const { userId, priceId, email } = req.body;

      if (!userId || !priceId) {
        return res.status(400).json({ error: "Missing userId or priceId" });
      }

      const stripeInst = getStripeInstance();
      if (!stripeInst) {
        return res.status(500).json({ error: "Stripe integration is not configured on this environment." });
      }

      const session = await stripeInst.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: "subscription",
        customer_email: email,
        client_reference_id: userId,
        success_url: `${req.headers.origin}/settings?session_id={CHECKOUT_SESSION_ID}&subscription=success`,
        cancel_url: `${req.headers.origin}/settings?subscription=cancel`,
      });

      res.json({ url: session.url });
    } catch (err: any) {
      console.error("Error creating subscription session:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
