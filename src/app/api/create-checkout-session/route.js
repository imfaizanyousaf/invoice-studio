
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(request) {
  try {
    const { priceId, packageDetails } = await request.json();  // ✅ Extract packageDetails here

    // Ensure metadata values are strings
    const metadata = {
      UserId: packageDetails.UserId.toString(),
      name: packageDetails.name,
      price: packageDetails.price.toString(),
      requests: JSON.stringify(packageDetails.requests),  // ✅ Metadata values must be strings
    };

    // Create a Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId, // Price ID from Stripe Dashboard
          quantity: 1,
        },
      ],
      mode: "payment", // or "subscription" for recurring payments
      success_url: `${request.headers.get("origin")}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.headers.get("origin")}/cancel`,
      metadata,  // ✅ Correctly passed metadata
    });

    return new Response(JSON.stringify({ id: session.id }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return new Response(JSON.stringify({ error: "Failed to create checkout session" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
}
