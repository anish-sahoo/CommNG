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
      footer={
        <div className="flex w-full flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isLeaving}
          >
            No, Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
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
