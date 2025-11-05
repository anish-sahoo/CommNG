"use client";

import { useMemo, useState } from "react";
import TextInput from "@/components/text-input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const BASE_AUDIENCE = {
  army: {
    ranks: ["E0", "O1", "TAG"],
    departments: [] as string[],
  },
  airforce: {
    ranks: ["Pilot Officer", "Squadron Leader"],
    departments: [] as string[],
  },
};

type AudienceKey =
  | "everyone"
  | "army-logistics"
  | "army-engineering"
  | "airforce-operations"
  | "airforce-maintenance";

type AudiencePreset = {
  label: string;
  targetAudience: {
    army: { ranks: string[]; departments: string[] };
    airforce: { ranks: string[]; departments: string[] };
  } | null;
};

const audiencePresets: Record<AudienceKey, AudiencePreset> = {
  everyone: {
    label: "Everyone",
    targetAudience: null,
  },
  "army-logistics": {
    label: "Army • Logistics",
    targetAudience: {
      army: {
        ranks: [...BASE_AUDIENCE.army.ranks],
        departments: ["Logistics"],
      },
      airforce: {
        ranks: [...BASE_AUDIENCE.airforce.ranks],
        departments: [],
      },
    },
  },
  "army-engineering": {
    label: "Army • Engineering",
    targetAudience: {
      army: {
        ranks: [...BASE_AUDIENCE.army.ranks],
        departments: ["Engineering"],
      },
      airforce: {
        ranks: [...BASE_AUDIENCE.airforce.ranks],
        departments: [],
      },
    },
  },
  "airforce-operations": {
    label: "Air Force • Operations",
    targetAudience: {
      army: {
        ranks: [...BASE_AUDIENCE.army.ranks],
        departments: [],
      },
      airforce: {
        ranks: [...BASE_AUDIENCE.airforce.ranks],
        departments: ["Operations"],
      },
    },
  },
  "airforce-maintenance": {
    label: "Air Force • Maintenance",
    targetAudience: {
      army: {
        ranks: [...BASE_AUDIENCE.army.ranks],
        departments: [],
      },
      airforce: {
        ranks: [...BASE_AUDIENCE.airforce.ranks],
        departments: ["Maintenance"],
      },
    },
  },
};

const deleteAfterOptions = [
  {
    id: "24h",
    label: "24 hours",
    getExpiry: () => new Date(Date.now() + 24 * 60 * 60 * 1000),
  },
  {
    id: "48h",
    label: "2 days",
    getExpiry: () => new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
  },
  {
    id: "168h",
    label: "7 days",
    getExpiry: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  },
];

export type BroadcastFormValues = {
  title: string;
  content: string;
  audienceKey: AudienceKey;
  validUntil: Date | null;
};

type BroadcastFormProps = {
  onSubmit: (values: BroadcastFormValues) => Promise<void> | void;
  submitting?: boolean;
  error?: string | null;
};

export function BroadcastForm({
  onSubmit,
  submitting = false,
  error = null,
}: BroadcastFormProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [audienceKey, setAudienceKey] = useState<AudienceKey>("everyone");
  const [deleteAfterId, setDeleteAfterId] = useState<string>("24h");

  const validUntil = useMemo(() => {
    const selected = deleteAfterOptions.find(
      (option) => option.id === deleteAfterId,
    );
    return selected ? selected.getExpiry() : null;
  }, [deleteAfterId]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();

    if (!trimmedTitle || !trimmedContent) {
      return;
    }

    await onSubmit({
      title: trimmedTitle,
      content: trimmedContent,
      audienceKey,
      validUntil,
    });
  };

  const isSubmitDisabled =
    submitting || title.trim().length === 0 || content.trim().length === 0;

  return (
    <form
      className="flex flex-col gap-6 rounded-2xl border border-border bg-card p-6 shadow-sm"
      onSubmit={handleSubmit}
    >
      <div className="flex flex-col gap-2">
        <label
          htmlFor="broadcast-audience"
          className="text-sm font-medium text-secondary"
        >
          Select Group
        </label>
        <Select
          value={audienceKey}
          onValueChange={(value) => setAudienceKey(value as AudienceKey)}
          disabled={submitting}
        >
          <SelectTrigger
            id="broadcast-audience"
            className="w-full justify-between"
            aria-labelledby="broadcast-audience"
          >
            <SelectValue placeholder="Select a group" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(audiencePresets).map(([key, preset]) => (
              <SelectItem key={key} value={key}>
                {preset.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <label
          htmlFor="broadcast-title"
          className="text-sm font-medium text-secondary"
        >
          Title
        </label>
        <div className="relative w-full">
          <TextInput
            id="broadcast-title"
            value={title}
            onChange={setTitle}
            placeholder="Title..."
            maxLength={120}
            disabled={submitting}
            showCharCount={false}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label
          htmlFor="broadcast-message"
          className="text-sm font-medium text-secondary"
        >
          Message
        </label>
        <Textarea
          id="broadcast-message"
          value={content}
          onChange={(event) => {
            const nextValue = event.target.value;
            if (nextValue.length <= 2000) {
              setContent(nextValue);
            }
          }}
          placeholder="Description..."
          rows={8}
          disabled={submitting}
        />
        <div className="self-end text-xs text-secondary/60">
          {content.length}/2000
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label
          htmlFor="broadcast-expiry"
          className="text-sm font-medium text-secondary"
        >
          Delete After
        </label>
        <Select
          value={deleteAfterId}
          onValueChange={(value) => setDeleteAfterId(value)}
          disabled={submitting}
        >
          <SelectTrigger
            id="broadcast-expiry"
            className="w-fit min-w-[10rem] justify-between"
            aria-labelledby="broadcast-expiry"
          >
            <SelectValue placeholder="Choose duration" />
          </SelectTrigger>
          <SelectContent>
            {deleteAfterOptions.map((option) => (
              <SelectItem key={option.id} value={option.id}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitDisabled}>
          {submitting ? "Sending…" : "Send Broadcast"}
        </Button>
      </div>
    </form>
  );
}

export function resolveAudience(key: AudienceKey) {
  return audiencePresets[key]?.targetAudience ?? null;
}
