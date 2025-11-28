"use client";

import type { RoleKey } from "@server/data/roles";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EXPIRY_OPTIONS, INVITE_PRESETS, type InvitePreset } from "../types";
import { getMinimalRoleSet } from "../utils/permission-helpers";
import { PermissionTree } from "./permission-tree";

export type InviteFormValues = {
  roleKeys: RoleKey[];
  expiresInHours: number;
};

type InviteFormProps = {
  onSubmit: (values: InviteFormValues) => Promise<void> | void;
  submitting?: boolean;
  error?: string | null;
};

export function InviteForm({
  onSubmit,
  submitting = false,
  error = null,
}: InviteFormProps) {
  const [preset, setPreset] = useState<InvitePreset>("basic-user");
  const [selectedRoles, setSelectedRoles] = useState<Set<RoleKey>>(
    new Set(INVITE_PRESETS["basic-user"].roleKeys),
  );
  const [expiresInHours, setExpiresInHours] = useState<number>(24);

  const handlePresetChange = (newPreset: InvitePreset) => {
    setPreset(newPreset);
    // Update selected roles based on preset
    setSelectedRoles(new Set(INVITE_PRESETS[newPreset].roleKeys));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (selectedRoles.size === 0) {
      return;
    }

    // Send only the minimal set of permissions
    const minimalRoles = getMinimalRoleSet(selectedRoles);

    await onSubmit({
      roleKeys: minimalRoles,
      expiresInHours,
    });
  };

  const isSubmitDisabled = submitting || selectedRoles.size === 0;

  return (
    <form
      className="flex flex-col gap-4 sm:gap-6 rounded-2xl border border-border bg-card p-4 sm:p-6 shadow-sm"
      onSubmit={handleSubmit}
    >
      {/* Preset Selection */}
      <div className="flex flex-col gap-2">
        <label
          htmlFor="invite-preset"
          className="text-sm font-medium text-secondary"
        >
          User Type Preset
        </label>
        <Select
          value={preset}
          onValueChange={(value) => handlePresetChange(value as InvitePreset)}
          disabled={submitting}
        >
          <SelectTrigger
            id="invite-preset"
            className="w-full justify-between py-3 sm:py-6 h-auto"
            aria-labelledby="invite-preset"
          >
            <SelectValue placeholder="Select a preset">
              <div className="flex flex-col items-start gap-0.5 sm:gap-1 py-0.5">
                <span className="text-sm sm:text-base font-medium">
                  {INVITE_PRESETS[preset].label}
                </span>
                <span className="hidden sm:block text-xs text-muted-foreground line-clamp-2">
                  {INVITE_PRESETS[preset].description}
                </span>
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="max-w-[calc(100vw-2rem)]">
            {Object.entries(INVITE_PRESETS).map(([key, config]) => (
              <SelectItem key={key} value={key} className="max-w-full">
                <div className="flex flex-col items-start gap-0.5 pr-2">
                  <span className="font-medium text-sm">{config.label}</span>
                  <span className="text-xs opacity-70 group-data-[highlighted]:opacity-100 group-data-[highlighted]:text-white break-words">
                    {config.description}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-secondary/70">
          Select a preset to pre-configure permissions, then customize as needed
          below.
        </p>
      </div>

      {/* Permission Tree */}
      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-medium text-secondary">Permissions</h3>
        <div className="rounded-lg border border-border bg-white p-3 sm:p-4 overflow-x-auto">
          <PermissionTree
            selectedRoles={selectedRoles}
            onRolesChange={setSelectedRoles}
          />
        </div>
      </div>

      {/* Expiry Selection */}
      <div className="flex flex-col gap-2">
        <label
          htmlFor="invite-expiry"
          className="text-sm font-medium text-secondary"
        >
          Expires After
        </label>
        <Select
          value={expiresInHours.toString()}
          onValueChange={(value) => setExpiresInHours(Number(value))}
          disabled={submitting}
        >
          <SelectTrigger
            id="invite-expiry"
            className="w-full sm:w-fit sm:min-w-[10rem] justify-between"
            aria-labelledby="invite-expiry"
          >
            <SelectValue placeholder="Choose duration" />
          </SelectTrigger>
          <SelectContent>
            {EXPIRY_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value.toString()}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-secondary/70">
          The invite code will expire after this duration and cannot be used.
        </p>
      </div>

      {/* Error Display */}
      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      ) : null}

      {/* Submit Button */}
      <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
        <div className="text-xs text-secondary/60 self-center">
          {selectedRoles.size} permission{selectedRoles.size !== 1 ? "s" : ""}{" "}
          selected
        </div>
        <Button
          type="submit"
          disabled={isSubmitDisabled}
          className="w-full sm:w-auto"
        >
          {submitting ? "Creating..." : "Create Invite Code"}
        </Button>
      </div>
    </form>
  );
}
