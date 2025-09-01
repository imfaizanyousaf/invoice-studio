"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { CheckCircleIcon } from "@heroicons/react/24/outline";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import CreatePlanDialog from "@/components/admin/CreatePlanDialog";
import { Delete, Pencil } from "lucide-react";

const SubscriptionPlans = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editPlan, setEditPlan] = useState(null);

  const [form, setForm] = useState({
    title: "",
    subtitle: "",
    features: "",
    price: "",
    stripePriceId: "",
    requests: "",
  });

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/plans/get");
      if (Array.isArray(res.data)) {
        setPlans(res.data);
      } else {
        toast.error("Unexpected data format");
      }
    } catch (err) {
      toast.error("Failed to fetch plans");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlan = async () => {
    const payload = {
      title: form.title,
      subtitle: form.subtitle,
      features: form.features.split(",").map((f) => f.trim()),
      price: parseFloat(form.price),
      stripePriceId: form.stripePriceId,
      requests: parseInt(form.requests),
    };

    try {
      const res = await axios.post(
        "/api/plans/create",
        payload
      );
      if (res.data?.success) {
        toast.success("Plan created successfully");

        // Clear form
        setForm({
          title: "",
          subtitle: "",
          features: "",
          price: "",
          stripePriceId: "",
          requests: "",
        });

        // Wait for data update, then close modal
        await fetchPlans();
        setOpen(false); // Only close after plans updated
      } else {
        toast.error(res.data?.message || "Creation failed");
      }
    } catch (error) {
      toast.error("API error");
      console.error(error);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);



  const handleDeletePlan = async (id: string) => {
   toast.loading("Deleting plan...");

    try {
      const res = await axios.post(`/api/plans/delete`, { id });
      
        toast.success("Plan deleted successfully");
        fetchPlans();
        
    } catch (error) {
      toast.dismiss();
      toast.error("API error");
      console.error(error);
    }
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold">Subscription Plans</h2>
        <CreatePlanDialog
          onSuccess={() => {
            fetchPlans();
            setEditPlan(null);
          }}
          editData={editPlan}
        />
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : plans.length === 0 ? (
        <p>No plans found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan, index) => (
            <div
              key={plan._id}
              className="border border-border bg-white dark:bg-card rounded-xl p-6 shadow-md hover:shadow-xl transition duration-300"
            >
              <div className="mb-4">
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-auto text-blue-500 hover:underline"
                  onClick={() => setEditPlan(plan)}
                >
                  <Pencil className="w-4 h-4" /> Edit
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-auto text-blue-500 hover:underline"
                  onClick={() => handleDeletePlan(plan._id)}
                >
                  <Delete className="w-4 h-4" /> Delete
                </Button>




                <h3 className="text-xl font-bold text-primary">{plan.title}</h3>
                <p className="text-sm text-muted-foreground">{plan.subtitle}</p>
              </div>
              <div className="text-3xl font-bold mb-2 text-foreground">
                {plan.price === 0 ? "Free" : `$${plan.price}`}
              </div>
              <p className="text-muted-foreground text-sm mb-2">
                One-Time Payment
              </p>
              <hr className="mb-4" />
              <ul className="text-muted-foreground text-sm space-y-2">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <CheckCircleIcon className="w-4 h-4 text-green-500" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SubscriptionPlans;
