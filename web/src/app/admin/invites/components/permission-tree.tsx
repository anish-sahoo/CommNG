"use client";

import type { RoleKey } from "@server/data/roles";
import { useEffect } from "react";
import { icons } from "@/components/icons";
import { cn } from "@/lib/utils";
import { PERMISSION_GROUPS } from "../types";
import {
  getAllDescendants,
  getDisplayName,
  getExpandedRoleKeys,
  isRoleImplied,
} from "../utils/permission-helpers";

const CheckIcon = icons.done;

type PermissionTreeProps = {
  selectedRoles: Set<RoleKey>;
  onRolesChange: (roles: Set<RoleKey>) => void;
};

export function PermissionTree({
  selectedRoles,
  onRolesChange,
}: PermissionTreeProps) {
  // Auto-select implied permissions when parent is selected
  useEffect(() => {
    // Get all roles including implied descendants
    const expandedRoles = getExpandedRoleKeys(Array.from(selectedRoles));
    const expandedSet = new Set(expandedRoles);

    // Check if we need to add any implied roles
    if (expandedSet.size !== selectedRoles.size) {
      onRolesChange(expandedSet);
    }
  }, [selectedRoles, onRolesChange]);

  const handleCheckboxChange = (roleKey: RoleKey, checked: boolean) => {
    if (checked) {
      // Just add the role, useEffect will handle expanding it
      const updatedRoles = new Set(selectedRoles);
      updatedRoles.add(roleKey);
      onRolesChange(updatedRoles);
    } else {
      // When unchecking, just keep everything BELOW this role in the hierarchy
      // and remove everything at or above it
      const updatedRoles = new Set<RoleKey>();

      // Special case: if unchecking global:admin, clear everything
      if (roleKey === "global:admin") {
        onRolesChange(updatedRoles);
        return;
      }

      // Get all descendants (everything below the unchecked role)
      const descendantsToKeep = getAllDescendants(roleKey);
      for (const descendant of descendantsToKeep) {
        updatedRoles.add(descendant);
      }

      onRolesChange(updatedRoles);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {PERMISSION_GROUPS.map((group) => (
        <div key={group.namespace} className="space-y-2 sm:space-y-3">
          <h3 className="text-sm font-semibold text-primary">{group.label}</h3>
          <div className="space-y-3 sm:space-y-2">
            {group.permissions.map((permission) => {
              const roleKey = permission.key as RoleKey;
              const isSelected = selectedRoles.has(roleKey);
              const implied = isRoleImplied(roleKey, selectedRoles);
              const isDisabled = false; // Allow unchecking implied permissions to "break out"
              const isChecked = isSelected || implied;
              const indentLevel = permission.impliedBy ? 1 : 0;

              return (
                <div
                  key={permission.key}
                  className="flex items-start gap-2 sm:gap-3"
                  style={{
                    paddingLeft:
                      indentLevel > 0 ? `${indentLevel * 1}rem` : "0",
                  }}
                >
                  <label
                    htmlFor={permission.key}
                    className="group relative flex items-start gap-2 sm:gap-3 flex-1 min-w-0 rounded-lg border border-transparent px-2 py-1.5 transition hover:bg-primary/5 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      id={permission.key}
                      checked={isChecked}
                      disabled={isDisabled}
                      onChange={(e) =>
                        handleCheckboxChange(roleKey, e.target.checked)
                      }
                      className="peer absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    />
                    <span
                      className={cn(
                        "mt-0.5 flex h-5 w-5 sm:h-5 sm:w-5 shrink-0 items-center justify-center rounded-sm border-2 text-transparent transition",
                        isChecked
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-secondary/40 bg-background",
                        !isChecked &&
                          !isDisabled &&
                          "group-hover:border-primary group-hover:bg-primary/10",
                      )}
                      aria-hidden="true"
                    >
                      {isChecked ? (
                        <CheckIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-accent" />
                      ) : null}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="block text-sm font-medium break-words text-secondary">
                        {permission.label}
                        {implied && !isSelected && (
                          <span className="ml-1 sm:ml-2 text-xs text-secondary/60 whitespace-nowrap">
                            (auto-granted)
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-secondary/70 break-words">
                        {permission.description}
                      </p>
                      {permission.impliedBy && (
                        <p className="mt-0.5 text-xs text-primary break-words">
                          ↳ Granted by: {getDisplayName(permission.impliedBy)}
                        </p>
                      )}
                    </div>
                  </label>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
