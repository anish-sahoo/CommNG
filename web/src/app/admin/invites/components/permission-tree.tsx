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
    const updatedRoles = new Set(selectedRoles);

    if (checked) {
      updatedRoles.add(roleKey);
    } else {
      // Remove the role
      updatedRoles.delete(roleKey);

      // If removing global:admin, clear everything
      if (roleKey === "global:admin") {
        updatedRoles.clear();
      } else {
        // Recursively remove all descendants
        const descendants = getAllDescendants(roleKey);
        for (const descendant of descendants) {
          updatedRoles.delete(descendant);
        }
      }
    }

    onRolesChange(updatedRoles);
  };

  return (
    <div className="space-y-6">
      {PERMISSION_GROUPS.map((group) => (
        <div key={group.namespace} className="space-y-3">
          <h3 className="text-sm font-semibold text-primary">{group.label}</h3>
          <div className="space-y-2">
            {group.permissions.map((permission) => {
              const roleKey = permission.key as RoleKey;
              const isSelected = selectedRoles.has(roleKey);
              const implied = isRoleImplied(roleKey, selectedRoles);
              const isDisabled = implied && !isSelected;
              const indentLevel = permission.impliedBy ? 1 : 0;

              return (
                <div
                  key={permission.key}
                  className="flex items-start gap-3"
                  style={{ paddingLeft: `${indentLevel * 1.5}rem` }}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <input
                      type="checkbox"
                      id={permission.key}
                      checked={isSelected || implied}
                      disabled={isDisabled}
                      onChange={(e) =>
                        handleCheckboxChange(roleKey, e.target.checked)
                      }
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <div className="flex-1 min-w-0">
                      <label
                        htmlFor={permission.key}
                        className={`block text-sm font-medium ${
                          isDisabled
                            ? "text-secondary/50 cursor-not-allowed"
                            : "text-secondary cursor-pointer"
                        }`}
                      >
                        {permission.label}
                        {implied && !isSelected && (
                          <span className="ml-2 text-xs text-secondary/60">
                            (auto-granted)
                          </span>
                        )}
                      </label>
                      <p className="mt-1 text-xs text-secondary/70">
                        {permission.description}
                      </p>
                      {permission.impliedBy && (
                        <p className="mt-0.5 text-xs text-blue-600/80">
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
