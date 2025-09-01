"use client"

import { Sheet, SheetContent, SheetTrigger, SheetTitle  } from "@/components/ui/sheet"
import React from "react"

type ActivityBarProps = {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  trigger?: React.ReactNode
  children: React.ReactNode
}

export function ActivityBar({ open, onOpenChange, trigger, children }: ActivityBarProps) {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const isControlled = open !== undefined && onOpenChange !== undefined

  return (
    <Sheet open={isControlled ? open : internalOpen} onOpenChange={isControlled ? onOpenChange : setInternalOpen}>
      {trigger && <SheetTrigger asChild>{trigger}</SheetTrigger>}
        {children}
    </Sheet>
  )
}
