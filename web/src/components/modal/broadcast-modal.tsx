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
      headerAlign="left"
      className="max-w-[92vw] w-[420px] p-6 pt-8 sm:p-7 sm:pt-10 space-y-6 [&>div:first-child]:space-y-3 [&>div:first-child>h2]:text-2xl [&>div:first-child>h2]:leading-snug [&>div:first-child>p]:leading-relaxed [&>div:first-child>p]:text-base"
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
