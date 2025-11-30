"use client";

import { useQuery } from "@tanstack/react-query";
import { icons } from "@/components/icons";
import { useTRPCClient } from "@/lib/trpc";

const UserIcon = icons.user;

export const Avatar = ({ avatarUrl }: { avatarUrl?: string | null }) => {
  const trpcClient = useTRPCClient();
  const { data: fileData } = useQuery({
    queryKey: ['file', avatarUrl],
    queryFn: () => trpcClient.files.getFile.query({ fileId: avatarUrl! }),
    enabled: !!avatarUrl,
  });
  const imageUrl = fileData?.data;

  return (
    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-primary-dark/30 bg-neutral/20 text-primary overflow-hidden">
      {imageUrl ? (
        <img src={imageUrl} alt="Avatar" className="w-full h-full object-cover rounded-full" />
      ) : (
        <UserIcon className="h-7 w-7" aria-label="Default user avatar" />
      )}
    </div>
  );
};