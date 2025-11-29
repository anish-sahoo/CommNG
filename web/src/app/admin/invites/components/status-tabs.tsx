import type { InviteCodeStatus } from "@server/types/invite-code-types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface StatusTabsProps {
  value: InviteCodeStatus | "all";
  onValueChange: (value: InviteCodeStatus | "all") => void;
}

const options = [
  { value: "all", label: "All Codes" },
  { value: "active", label: "Active" },
  { value: "used", label: "Used" },
  { value: "expired", label: "Expired" },
  { value: "revoked", label: "Revoked" },
] as const;

export function StatusTabs({ value, onValueChange }: StatusTabsProps) {
  return (
    <>
      {/* Mobile Dropdown */}
      <div className="sm:hidden">
        <Select
          value={value}
          onValueChange={(val) =>
            onValueChange(val as (typeof options)[number]["value"])
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Desktop Tabs */}
      <div className="hidden sm:block">
        <Tabs
          value={value}
          onValueChange={(val) =>
            onValueChange(val as (typeof options)[number]["value"])
          }
        >
          <TabsList>
            {options.map((option) => (
              <TabsTrigger key={option.value} value={option.value}>
                {option.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>
    </>
  );
}
