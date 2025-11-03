"use client";

import type { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type ModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
  className?: string;
};

export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  className,
}: ModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={className}>
        {(title || description) && (
          <DialogHeader>
            {title && <DialogTitle>{title}</DialogTitle>}
            {description && (
              <DialogDescription>{description}</DialogDescription>
            )}
          </DialogHeader>
        )}
        {children}
        {footer && <DialogFooter>{footer}</DialogFooter>}
      </DialogContent>
    </Dialog>
  );
}

export type { BroadcastModalProps } from "./broadcast-modal";
// Export all modal components
export { BroadcastModal } from "./broadcast-modal";
export type { CreatePostModalProps } from "./create-post-modal";
export { CreatePostModal } from "./create-post-modal";
export type { LeaveChannelModalProps } from "./leave-channel-modal";
export { LeaveChannelModal } from "./leave-channel-modal";
export type { RemoveMemberModalProps } from "./remove-member-modal";
export { RemoveMemberModal } from "./remove-member-modal";
