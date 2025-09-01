"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircleIcon } from "@heroicons/react/24/outline";
import { loadStripe } from "@stripe/stripe-js";
import { usePackage } from "@/context/PackageContext";
import { useUser } from "@/context/UserContext";
import axios from "axios";


interface Card {
  id: string;
  title: string;
  description: string;
  price: number;
  requests: number;
  stripePriceId: String,
  features: [];
}

interface PricingCardProps {
  card: Card;
  active: boolean;
  onClick: () => void;
  currentPlan?: boolean;
}

const PricingCard: React.FC<PricingCardProps> = ({ card, active, onClick, currentPlan = false }) => {
    const { savePackage } = usePackage();
    const { user } = useUser();
    const [loading, setLoading] = useState(false);
    console.log("price card user", user)
    
    
    const handleCheckout = async () => {
        console.log("checkout");
        setLoading(true);

        // const res = await axios.post("/api/packages/create", {
        //   UserId: user?.userId || user?._id || "",
        //   name: card.title,
        //   price: card.price,
        //   requests: card.requests,
        // })
        // console.log("res", res)
    
        const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "");
    
        if (!stripe) {
          console.error("Failed to load Stripe");
          setLoading(false);
          return;
        }
    
        const response = await fetch("/api/create-checkout-session", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            priceId: card.stripePriceId,
            packageDetails: {
              UserId: user?.userId || user?._id || "",
              name: card.title,
              price: card.price,
              requests: card.requests,
            }
          }),
        });
    
        const session = await response.json();
    
        const result = await stripe.redirectToCheckout({ sessionId: session.id });
        setLoading(false);
    
        if (result.error) {
          console.error(result.error.message);
        }
    };

    
      return (
        <div 
            onClick={onClick}
            className={`flex flex-col gap-4 border ${
                active 
                    ? "border-primary shadow-lg shadow-primary/20" 
                    : "border-border"
            } bg-card backdrop-blur-[70px] rounded-[20px] p-4 transition-all duration-300 cursor-pointer hover:scale-[1.02]`}
        >
            <div className="flex flex-col gap-2">
                <h1 className={`${active ? "text-primary" : "text-foreground"} text-2xl font-bold transition-colors`}>{card.title}</h1>
                <p className="text-muted-foreground text-sm">{card.description}</p>
            </div>
            
            <div className="flex items-center gap-2">
                <p className="text-foreground text-4xl font-bold">{card.price === 0 ? "Free" : `$${card.price}`}</p>
                <p className="text-muted-foreground text-sm"> One-Time Payment</p>
            </div>
            <div className="flex flex-col py-2 gap-2">
                <p className="text-foreground text-sm">Features</p>
                <div className="w-full h-[1px] bg-border"></div>
            </div>
            <ul className="list-disc list-inside text-muted-foreground text-lg">
                {card.features.map((feature) => (
                    <li className="flex items-center gap-2">
                        <CheckCircleIcon className={`w-4 h-4 ${active ? "text-primary" : "text-muted-foreground"}`} />
                        {feature}
                    </li>
                ))}
            </ul>
            {card.title !== "Free" && <button 
                onClick={handleCheckout}
                disabled={loading} 
                className={`text-foreground text-lg font-semibold my-4 cursor-pointer border border-border bg-card
                backdrop-blur-[70px] rounded-lg items-center justify-center flex gap-2 p-2 transition-all hover:bg-gradient-to-r hover:from-primary hover:to-primary/80 hover:border-transparent disabled:cursor-not-allowed`}
            >
                 Buy now
            </button>}

            {/* {currentPlan && <button 
                // onClick={handleCheckout} 
                className={`text-foreground text-lg font-semibold my-4 border ${
                    currentPlan 
                        ? "bg-gradient-to-r from-primary to-primary/80 border-transparent" 
                        : "border-border bg-card"
                } backdrop-blur-[70px] rounded-lg items-center justify-center flex gap-2 p-2 transition-all hover:bg-gradient-to-r hover:from-primary hover:to-primary/80 hover:border-transparent`}
            >
                {
                    currentPlan? "Current plan" : "Get Started"
                }
                
            </button>} */}

        </div>
    );
};

export default PricingCard;