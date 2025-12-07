"use client";

import { Button } from "@/components/ui/button";
import { Modal, type ModalProps } from "./index";

export type LeaveChannelModalProps = Omit<
  ModalProps,
  "title" | "description" | "children" | "footer"
> & {
  onLeave: () => void | Promise<void>;
  isLeaving?: boolean;
};

export function LeaveChannelModal({
  open,
  onOpenChange,
  onLeave,
  isLeaving = false,
}: LeaveChannelModalProps) {
  const handleLeave = async () => {
    await onLeave();
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Are you sure you want to leave this channel?"
      description="This action cannot be undone. You will not be able to re-join this channel unless an admin adds you."
      headerAlign="left"
      className="max-w-[92vw] w-[420px] p-6 pt-8 sm:p-7 sm:pt-10 space-y-6 [&>div:first-child]:space-y-3 [&>div:first-child>h2]:text-2xl [&>div:first-child>h2]:leading-snug [&>div:first-child>p]:leading-relaxed [&>div:first-child>p]:text-base"
      footer={
        <div className="flex w-full flex-col-reverse gap-4 sm:flex-row sm:justify-end sm:gap-5 mt-3">
          <Button
            type="button"
            variant="outline"
            className="h-11"
            onClick={handleCancel}
            disabled={isLeaving}
            aria-label="Cancel leaving channel"
          >
            No, Cancel
          </Button>
          <Button
            type="button"
            variant="default"
            className="h-11 bg-error text-white hover:bg-error/90 focus-visible:ring-error/30"
            onClick={handleLeave}
            disabled={isLeaving}
          >
            {isLeaving ? "Leaving…" : "Yes, Leave"}
          </Button>
        </div>
      }
    />
  );
}
