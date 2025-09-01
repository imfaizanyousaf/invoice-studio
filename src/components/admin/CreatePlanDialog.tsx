"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, Pencil } from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";

interface Props {
  onSuccess?: () => void;
  editData?: any | null; // Optional for edit
}

export default function CreatePlanDialog({ onSuccess, editData }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    subtitle: "",
    features: "",
    price: "",
    stripePriceId: "",
    requests: "",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    if (editData) {
      setForm({
        title: editData.title || "",
        subtitle: editData.subtitle || "",
        features: (editData.features || []).join(", "),
        price: editData.price?.toString() || "",
        stripePriceId: editData.stripePriceId || "",
        requests: editData.requests?.toString() || "",
      });
      setOpen(true);
    }
  }, [editData]);

  const validate = () => {
    if (!form.title.trim()) return "Title is required";
    if (!form.price || isNaN(Number(form.price))) return "Valid price is required";
    if (!form.requests || isNaN(Number(form.requests))) return "Valid request limit is required";
    return "";
  };

  const handleSubmit = async () => {
    const errMsg = validate();
    if (errMsg) return setError(errMsg);

    setLoading(true);
    setError("");

    try {
      const payload = {
        title: form.title,
        subtitle: form.subtitle,
        features: form.features.split(",").map((f) => f.trim()),
        price: parseFloat(form.price),
        stripePriceId: form.stripePriceId,
        requests: parseInt(form.requests),
      };

      let res;
      if (editData?._id) {
        res = await axios.patch(`/api/plans/${editData._id}`, payload);
      } else {
        res = await axios.post("/api/plans/create", payload);
      }

      if (res.data) {
        toast.success(editData ? "Plan updated successfully" : "Plan created successfully");
        setForm({
          title: "",
          subtitle: "",
          features: "",
          price: "",
          stripePriceId: "",
          requests: "",
        });
        setTimeout(() => setOpen(false), 0);
        onSuccess?.();
      } else {
        toast.error("Operation failed");
      }
    } catch (err) {
      toast.error("API Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); setError(""); }}>
      {!editData && (
        <DialogTrigger asChild>
          <Button className="bg-gradient-to-r from-primary to-accent text-white">
            <Plus className="mr-2 h-4 w-4" /> Create Plan
          </Button>
        </DialogTrigger>
      )}

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editData ? "Edit Plan" : "Create a New Plan"}</DialogTitle>
        </DialogHeader>

        
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Title</label>
          <Input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Subtitle</label>
          <Input placeholder="Subtitle" value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} />
          </div>
          
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Features</label>
          <Textarea placeholder="Features (comma-separated)" value={form.features} onChange={(e) => setForm({ ...form, features: e.target.value })} />
          </div>
          
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Price</label>
          <Input type="number" placeholder="Price" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Stripe Price ID</label>
          <Input placeholder="Stripe Price ID" value={form.stripePriceId} onChange={(e) => setForm({ ...form, stripePriceId: e.target.value })} />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Request Limit</label>
          <Input type="number" placeholder="Request Limit" value={form.requests} onChange={(e) => setForm({ ...form, requests: e.target.value })} />
          </div>
          
          {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
        

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? (editData ? "Updating..." : "Creating...") : (editData ? "Update" : "Submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
