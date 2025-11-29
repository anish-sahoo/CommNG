"use client";

import type { RoleKey } from "@server/data/roles";
import { Check, Clock, Copy } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  getDisplayName,
  getExpandedRoleKeys,
} from "../utils/permission-helpers";

type InviteSuccessProps = {
  code: string;
  roleKeys: RoleKey[];
  expiresAt: Date;
  onCreateAnother: () => void;
};

export function InviteSuccess({
  code,
  roleKeys,
  expiresAt,
  onCreateAnother,
}: InviteSuccessProps) {
  const [copied, setCopied] = useState(false);
  const expandedRoleKeys = getExpandedRoleKeys(roleKeys);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const formatExpiryDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(date);
  };

  return (
    <div className="flex flex-col gap-4 sm:gap-6 rounded-2xl border border-green-200 bg-green-50 p-4 sm:p-6 shadow-sm">
      {/* Success Header */}
      <div className="flex items-center gap-3">
        <div className="flex shrink-0 h-10 w-10 items-center justify-center rounded-full bg-green-600">
          <Check className="h-6 w-6 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-green-900">
            Invite Code Created Successfully
          </h3>
          <p className="text-sm text-green-700">
            Share this code with the new user to grant them access.
          </p>
        </div>
      </div>

      {/* Invite Code Display */}
      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-medium text-green-900">Invite Code</h3>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <div className="flex-1 rounded-lg border-2 border-green-300 bg-white px-3 sm:px-4 py-3 overflow-x-auto">
            <code className="text-xl sm:text-2xl font-mono font-bold tracking-wider text-green-900 break-all">
              {code}
            </code>
          </div>
          <Button
            type="button"
            onClick={handleCopy}
            variant={copied ? "default" : "outline"}
            className="px-4 sm:px-6 w-full sm:w-auto"
          >
            {copied ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="mr-2 h-4 w-4" />
                Copy Code
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Expiry Information */}
      <div className="flex flex-col gap-2 rounded-lg border border-green-200 bg-white p-4">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-green-700" />
          <span className="text-sm font-medium text-green-900">
            Expires: {formatExpiryDate(expiresAt)}
          </span>
        </div>
      </div>

      {/* Assigned Permissions */}
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-green-900">
          Assigned Permissions ({expandedRoleKeys.length})
        </p>
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {expandedRoleKeys.map((role) => (
            <span
              key={role}
              className="inline-flex items-center rounded-full bg-green-100 px-2.5 sm:px-3 py-1 text-xs font-medium text-green-800 break-words"
            >
              {getDisplayName(role)}
            </span>
          ))}
        </div>
      </div>

      {/* Action Button */}
      <div className="flex justify-end border-t border-green-200 pt-4">
        <Button
          type="button"
          onClick={onCreateAnother}
          variant="outline"
          className="w-full sm:w-auto"
        >
          Create Another Invite
        </Button>
      </div>
    </div>
  );
}
