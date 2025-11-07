"use client";

import { Button } from "@/components/ui/button";
import { Modal, type ModalProps } from "./index";

export type BroadcastModalProps = Omit<
  ModalProps,
  "title" | "children" | "footer"
> & {
  title: string;
  message: string;
  onAcknowledge: () => void;
  acknowledgeLabel?: string;
};

export function BroadcastModal({
  open,
  onOpenChange,
  title,
  message,
  onAcknowledge,
  acknowledgeLabel = "Acknowledge",
}: BroadcastModalProps) {
  const handleAcknowledge = () => {
    onAcknowledge();
    onOpenChange(false);
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      footer={
        <Button onClick={handleAcknowledge} className="w-full sm:w-auto">
          {acknowledgeLabel}
        </Button>
      }
    >
      <p className="text-sm text-secondary">{message}</p>
    </Modal>
  );
}
