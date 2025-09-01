
'use client';

import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from "@/hooks/use-toast";
import { X } from 'lucide-react';

interface SettingsPanelProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

// Define the base user settings schema without refinement
const userSettingsObjectSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  mobile: z.string()
    .regex(/^$|^\+?[1-9]\d{1,14}$/, 'Invalid mobile number format') // E.164 basic format or empty
    .optional()
    .or(z.literal('')),
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .optional()
    .or(z.literal('')), // Allow empty if not changing
  confirmPassword: z.string().optional().or(z.literal('')),
});

const paymentSettingsSchema = z.object({
  cardNumber: z.string()
    .regex(/^$|^\d{16}$/, 'Card number must be 16 digits') // 16 digits or empty
    .optional()
    .or(z.literal('')),
  expiryDate: z.string()
    .regex(/^$|^(0[1-9]|1[0-2])\/\d{2}$/, 'Expiry date must be MM/YY format') // MM/YY or empty
    .optional()
    .or(z.literal('')),
  cvv: z.string()
    .regex(/^$|^\d{3,4}$/, 'CVV must be 3 or 4 digits') // 3 or 4 digits or empty
    .optional()
    .or(z.literal('')),
});

// Merge the object schemas first
const combinedObjectSchema = userSettingsObjectSchema.merge(paymentSettingsSchema);

// Then apply the refinement to the combined schema
const combinedSchema = combinedObjectSchema.refine(data => {
  if (data.password && data.password.length > 0) { // Only validate confirmPassword if password is being set
    return data.password === data.confirmPassword;
  }
  return true; // If password is not being set, confirmPassword can be anything (or empty)
}, {
  message: "Passwords don't match",
  path: ['confirmPassword'], // Apply error to confirmPassword field
});


type SettingsFormData = z.infer<typeof combinedSchema>;

export function SettingsPanel({ isOpen, onOpenChange }: SettingsPanelProps) {
  const { toast } = useToast();
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    // reset, // Can be used to clear form after submission
  } = useForm<SettingsFormData>({
    resolver: zodResolver(combinedSchema),
    defaultValues: {
      name: '',
      mobile: '',
      email: '',
      password: '',
      confirmPassword: '',
      cardNumber: '',
      expiryDate: '',
      cvv: '',
    },
  });

  const onSubmit = async (data: SettingsFormData) => {
    // In a real app, you would send this data to your backend
    // Filter out empty password fields if not changing
    const dataToSubmit: Partial<SettingsFormData> = { ...data };
    if (!data.password) {
      delete dataToSubmit.password;
      delete dataToSubmit.confirmPassword;
    }
    
    console.log('Settings data submitted:', dataToSubmit);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
    toast({
      title: 'Settings Saved',
      description: 'Your information has been updated (simulated).',
    });
    // onOpenChange(false); // Optionally close panel after successful submission
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-full max-w-md flex flex-col p-0" side="right">
        <SheetHeader className="p-6 pb-4 border-b">
          <SheetTitle>Settings</SheetTitle>
          <SheetDescription>
            Manage your account details and payment preferences.
          </SheetDescription>
          <SheetClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
            <X className="h-5 w-5" />
            <span className="sr-only">Close</span>
          </SheetClose>
        </SheetHeader>

        <ScrollArea className="flex-grow">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-6">
            {/* User Information Section */}
            <section className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">User Information</h3>
              <div className="space-y-1">
                <Label htmlFor="name">Full Name</Label>
                <Controller
                  name="name"
                  control={control}
                  render={({ field }) => <Input id="name" placeholder="e.g., John Doe" {...field} />}
                />
                {errors.name && <p className="text-xs text-destructive mt-1">{errors.name.message}</p>}
              </div>

              <div className="space-y-1">
                <Label htmlFor="mobile">Mobile Number</Label>
                <Controller
                  name="mobile"
                  control={control}
                  render={({ field }) => <Input id="mobile" type="tel" placeholder="e.g., +1 123 456 7890" {...field} />}
                />
                {errors.mobile && <p className="text-xs text-destructive mt-1">{errors.mobile.message}</p>}
              </div>

              <div className="space-y-1">
                <Label htmlFor="email">Email Address</Label>
                <Controller
                  name="email"
                  control={control}
                  render={({ field }) => <Input id="email" type="email" placeholder="user@example.com" {...field} />}
                />
                {errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}
              </div>

              <div className="space-y-1">
                <Label htmlFor="password">New Password</Label>
                <Controller
                  name="password"
                  control={control}
                  render={({ field }) => <Input id="password" type="password" placeholder="Leave blank to keep current" {...field} />}
                />
                {errors.password && <p className="text-xs text-destructive mt-1">{errors.password.message}</p>}
              </div>
               <div className="space-y-1">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Controller
                  name="confirmPassword"
                  control={control}
                  render={({ field }) => <Input id="confirmPassword" type="password" placeholder="Confirm new password" {...field} />}
                />
                {errors.confirmPassword && <p className="text-xs text-destructive mt-1">{errors.confirmPassword.message}</p>}
              </div>
            </section>

            <Separator />

            {/* Payment Information Section */}
            <section className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Payment Information</h3>
              <div className="space-y-1">
                <Label htmlFor="cardNumber">Card Number</Label>
                <Controller
                  name="cardNumber"
                  control={control}
                  render={({ field }) => <Input id="cardNumber" placeholder="•••• •••• •••• ••••" {...field} />}
                />
                {errors.cardNumber && <p className="text-xs text-destructive mt-1">{errors.cardNumber.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="expiryDate">Expiry Date (MM/YY)</Label>
                  <Controller
                    name="expiryDate"
                    control={control}
                    render={({ field }) => <Input id="expiryDate" placeholder="MM/YY" {...field} />}
                  />
                  {errors.expiryDate && <p className="text-xs text-destructive mt-1">{errors.expiryDate.message}</p>}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="cvv">CVV</Label>
                  <Controller
                    name="cvv"
                    control={control}
                    render={({ field }) => <Input id="cvv" placeholder="•••" {...field} />}
                  />
                  {errors.cvv && <p className="text-xs text-destructive mt-1">{errors.cvv.message}</p>}
                </div>
              </div>
              <p className="text-xs text-muted-foreground pt-2">
                Your payment details are securely handled. (This is a user interface demonstration).
              </p>
            </section>
            
            <SheetFooter className="pt-6 pb-2 sticky bottom-0 bg-background">
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving Changes...' : 'Save All Changes'}
                </Button>
            </SheetFooter>
          </form>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

