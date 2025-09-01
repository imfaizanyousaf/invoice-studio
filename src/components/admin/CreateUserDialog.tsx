"use client";

import { useState } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

type Props = {
  /** Invite success ke baad parent ko refetch karwana ho to ye call ho jayega */
  onSuccess?: () => void;
};

export default function CreateUserDialog({ onSuccess }: Props) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<{ name: string; email: string; role: "admin" | "user" }>({
    name: "",
    email: "",
    role: "user",
  });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const validateEmail = (email: string) => /[^@\s]+@[^@\s]+\.[^@\s]+/.test(email);

  const submit = async () => {
    if (!form.name.trim()) return setErr("Name is required");
    if (!validateEmail(form.email)) return setErr("Valid email is required");

    setErr(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          role: form.role, 
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok || json?.success === false) {
        throw new Error(json?.message || `Invite failed (${res.status})`);
      }

      onSuccess?.();
      setOpen(false);
      setForm({ name: "", email: "", role: "user" });
    } catch (e: any) {
      setErr(e?.message || "Failed to invite user");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setErr(null); }}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-primary to-accent text-primary-foreground">
          <Plus className="mr-2 h-4 w-4" /> New User
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Invite User</DialogTitle>
          <DialogDescription>Only name, email and role are required.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. John Doe"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label>Email</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="name@company.com"
              disabled={loading}
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label>Role</Label>
            <Select
              value={form.role}
              onValueChange={(v) => setForm((f) => ({ ...f, role: v as "admin" | "user" }))}
              disabled={loading}
            >
              <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="user">User</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {err && <p className="text-sm text-red-500">{err}</p>}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>Cancel</Button>
          <Button onClick={submit} disabled={loading}>{loading ? "Inviting..." : "Invite"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
