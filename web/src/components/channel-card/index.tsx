import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import { type IconName, icons } from "@/components/icons";

interface ChannelCardProps {
  imageSrc?: string;
  title: string;
  description: string;
  iconName: IconName;
  href: Route | string;
}

const ChannelCard: React.FC<ChannelCardProps> = ({
  imageSrc,
  title,
  description,
  iconName,
  href,
}) => {
  const Icon = icons[iconName];

  const truncatedTitle =
    title.length > 22 ? `${title.slice(0, 22).trim()}…` : title;

  const truncatedDescription =
    description.length > 52
      ? `${description.slice(0, 52).trim()}…`
      : description;

  return (
    <div className="group flex w-full min-h-[15rem] flex-col overflow-hidden rounded-2xl border border-neutral/50 bg-card shadow-sm sm:min-h-[16rem]">
      <div className="relative h-32 w-full overflow-hidden bg-neutral sm:h-36">
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={title}
            fill
            sizes="(min-width: 640px) 19rem, 100vw"
            className="object-cover"
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
