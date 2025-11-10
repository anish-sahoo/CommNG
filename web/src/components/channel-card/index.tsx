"use client";

import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { type IconName, icons } from "@/components/icons";
import { useTRPCClient } from "@/lib/trpc";

interface ChannelCardProps {
  imageFileId?: string;
  title: string;
  description: string;
  iconName: IconName;
  href: Route | string;
  priority?: boolean;
}

const ChannelCard: React.FC<ChannelCardProps> = ({
  imageFileId,
  title,
  description,
  iconName,
  href,
  priority = false,
}) => {
  const Icon = icons[iconName];
  const trpcClient = useTRPCClient();
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!imageFileId) {
      return;
    }

    // If it's a direct path/URL, use it directly
    if (imageFileId.startsWith("/") || imageFileId.startsWith("http")) {
      setImageUrl(imageFileId);
      return;
    }

    // Otherwise, fetch from the files API
    const fetchImage = async () => {
      try {
        const fileData = await trpcClient.files.getFile.query({
          fileId: imageFileId,
        });
        setImageUrl(fileData.data);
      } catch (error) {
        console.error("Failed to fetch channel image:", error);
        setImageUrl(null);
      }
    };

    void fetchImage();
  }, [imageFileId, trpcClient]);

  const truncatedTitle =
    title.length > 22 ? `${title.slice(0, 22).trim()}…` : title;

  const truncatedDescription =
    description.length > 52
      ? `${description.slice(0, 52).trim()}…`
      : description;

  // Check if image is from S3 (external URL with signed parameters)
  const isS3Image = imageUrl?.includes('amazonaws.com') ?? false;

  return (
    <div className="group flex w-full min-h-[15rem] flex-col overflow-hidden rounded-2xl border border-neutral/50 bg-card shadow-sm sm:min-h-[16rem]">
      <div className="relative h-32 w-full overflow-hidden bg-neutral sm:h-36">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={title}
            fill
            sizes="(min-width: 640px) 19rem, 100vw"
            className="object-cover"
            priority={priority}
            unoptimized={isS3Image}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-body text-secondary/50">
              Image Placeholder
            </span>
          </div>
        )}
      </div>

      <Link
        href={href as Route}
        className="flex flex-1 cursor-pointer flex-col gap-1 bg-primary px-5 py-4 transition-colors duration-200 group-hover:bg-primary-dark"
      >
        <div className="flex items-center gap-2 leading-tight">
          {Icon && <Icon className="h-5 w-5 text-accent" />}
          <h3
            className="text-subheader text-lg font-semibold text-background"
            title={title}
          >
            {truncatedTitle}
          </h3>
        </div>
        <p
          className="text-body text-background/80 leading-snug line-clamp-2"
          title={description}
        >
          {truncatedDescription}
        </p>
      </Link>
    </div>
  );
};

export default ChannelCard;
