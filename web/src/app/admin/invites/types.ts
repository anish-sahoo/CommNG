import type { RoleKey } from "@server/data/roles";

/**
 * Preset role configurations for invite codes
 */
export type InvitePreset = "basic-user" | "admin-user" | "super-admin";

/**
 * Configuration for each preset
 */
export type PresetConfig = {
  label: string;
  description: string;
  roleKeys: RoleKey[];
};

/**
 * All preset configurations
 */
export const INVITE_PRESETS: Record<InvitePreset, PresetConfig> = {
  "basic-user": {
    label: "Basic User",
    description:
      "Can create and read reports. Limited access for standard members.",
    roleKeys: ["reporting:create"],
  },
  "admin-user": {
    label: "Admin User",
    description:
      "Can manage reports, send broadcasts, and create invites. Suitable for team leaders.",
    roleKeys: ["reporting:admin", "broadcast:create", "global:create-invite"],
  },
  "super-admin": {
    label: "Super Admin",
    description:
      "Full system access with all permissions. Reserved for system administrators.",
    roleKeys: ["global:admin"],
  },
};

/**
 * Descriptions for each permission type
 */
export const PERMISSION_DESCRIPTIONS: Record<RoleKey, string> = {
  // Global permissions
  "global:admin":
    "Full system administrator access. Automatically grants all other permissions in the system.",
  "global:create-invite": "Create and manage invite codes for new users.",

  // Reporting permissions
  "reporting:admin":
    "Full report management capabilities. Can perform all reporting actions including admin, assign, delete, update, create, and read.",
  "reporting:assign": "Assign reports to other users for review or action.",
  "reporting:delete": "Delete reports from the system.",
  "reporting:update": "Edit and modify existing reports.",
  "reporting:create": "Create new reports.",
  "reporting:read": "View existing reports in the system.",

  // Broadcast permissions
  "broadcast:create": "Send broadcast messages to groups or all users.",
};

/**
 * Permission namespace grouping
 */
export type PermissionNamespace = "global" | "reporting" | "broadcast";

/**
 * Structure for organizing permissions by namespace
 */
export type PermissionGroup = {
  namespace: PermissionNamespace;
  label: string;
  permissions: {
    key: RoleKey;
    label: string;
    description: string;
    impliedBy?: RoleKey; // Parent permission that grants this one
  }[];
};

/**
 * Hierarchical permission structure for display
 */
export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    namespace: "global",
    label: "Global Permissions",
    permissions: [
      {
        key: "global:admin",
        label: "Global Administrator",
        description: PERMISSION_DESCRIPTIONS["global:admin"],
      },
      {
        key: "global:create-invite",
        label: "Create Invites",
        description: PERMISSION_DESCRIPTIONS["global:create-invite"],
        impliedBy: "global:admin",
      },
    ],
  },
  {
    namespace: "reporting",
    label: "Reporting Permissions",
    permissions: [
      {
        key: "reporting:admin",
        label: "Report Administrator",
        description: PERMISSION_DESCRIPTIONS["reporting:admin"],
      },
      {
        key: "reporting:assign",
        label: "Assign Reports",
        description: PERMISSION_DESCRIPTIONS["reporting:assign"],
        impliedBy: "reporting:admin",
      },
      {
        key: "reporting:delete",
        label: "Delete Reports",
        description: PERMISSION_DESCRIPTIONS["reporting:delete"],
        impliedBy: "reporting:assign",
      },
      {
        key: "reporting:update",
        label: "Update Reports",
        description: PERMISSION_DESCRIPTIONS["reporting:update"],
        impliedBy: "reporting:delete",
      },
      {
        key: "reporting:create",
        label: "Create Reports",
        description: PERMISSION_DESCRIPTIONS["reporting:create"],
        impliedBy: "reporting:update",
      },
      {
        key: "reporting:read",
        label: "Read Reports",
        description: PERMISSION_DESCRIPTIONS["reporting:read"],
        impliedBy: "reporting:create",
      },
    ],
  },
  {
    namespace: "broadcast",
    label: "Broadcast Permissions",
    permissions: [
      {
        key: "broadcast:create",
        label: "Create Broadcasts",
        description: PERMISSION_DESCRIPTIONS["broadcast:create"],
      },
    ],
  },
];

/**
 * Form state for invite creation
 */
export type InviteFormState = {
  preset: InvitePreset;
  selectedRoles: Set<RoleKey>;
  expiresInHours: number;
};

/**
 * Expiry options for invite codes
 */
export const EXPIRY_OPTIONS = [
  { value: 24, label: "24 hours" },
  { value: 48, label: "2 days" },
  { value: 72, label: "3 days" },
  { value: 168, label: "7 days" },
  { value: 336, label: "14 days" },
  { value: 720, label: "30 days" },
];
