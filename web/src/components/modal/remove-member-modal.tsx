"use client";

import { Button } from "@/components/ui/button";
import { Modal, type ModalProps } from "./index";

export type RemoveMemberModalProps = Omit<
  ModalProps,
  "title" | "description" | "children" | "footer"
> & {
  memberName: string;
  onRemove: () => void | Promise<void>;
  isRemoving?: boolean;
};

export function RemoveMemberModal({
  open,
  onOpenChange,
  memberName,
  onRemove,
  isRemoving = false,
}: RemoveMemberModalProps) {
  const handleRemove = async () => {
    await onRemove();
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={`Are you sure you want to remove ${memberName} from this channel?`}
      footer={
        <div className="flex w-full flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isRemoving}
          >
            No, Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleRemove}
            disabled={isRemoving}
          >
            {isRemoving ? "Removing…" : "Yes, Remove"}
          </Button>
        </div>
      }
    />
  );
}
