"use client";

import type { RoleKey } from "@server/data/roles";
import { useEffect } from "react";
import { PERMISSION_GROUPS } from "../types";
import {
  getAllDescendants,
  getDisplayName,
  getExpandedRoleKeys,
  isRoleImplied,
} from "../utils/permission-helpers";

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
                  <div className="flex items-start sm:items-center gap-2 sm:gap-3 flex-1 min-w-0">
                    <input
                      type="checkbox"
                      id={permission.key}
                      checked={isSelected || implied}
                      disabled={isDisabled}
                      onChange={(e) =>
                        handleCheckboxChange(roleKey, e.target.checked)
                      }
                      className="h-4 w-4 mt-0.5 sm:mt-0 flex-shrink-0 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex-1 min-w-0">
                      <label
                        htmlFor={permission.key}
                        className="block text-sm font-medium break-words text-secondary cursor-pointer"
                      >
                        {permission.label}
                        {implied && !isSelected && (
                          <span className="ml-1 sm:ml-2 text-xs text-secondary/60 whitespace-nowrap">
                            (auto-granted)
                          </span>
                        )}
                      </label>
                      <p className="mt-1 text-xs text-secondary/70 break-words">
                        {permission.description}
                      </p>
                      {permission.impliedBy && (
                        <p className="mt-0.5 text-xs text-blue-600/80 break-words">
                          ↳ Granted by: {getDisplayName(permission.impliedBy)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
