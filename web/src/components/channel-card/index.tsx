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
    description.length > 52 ? `${description.slice(0, 52).trim()}…` : description;

  return (
    <div className="group h-64 w-64 rounded-2xl border border-neutral/50 bg-white shadow-[0_16px_28px_0_rgba(34,33,33,0.12)] transition-[box-shadow,transform] duration-200 hover:shadow-[0_22px_38px_0_rgba(34,33,33,0.16)]">
      <div className="flex h-3/5 items-center justify-center overflow-hidden rounded-t-2xl bg-neutral">
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={title}
            className="h-full w-full object-cover"
            width={300}
            height={200}
          />
        ) : (
          <span className="text-body text-secondary/50">Image Placeholder</span>
        )}
      </div>

      <Link
        href={href as Route}
        className="flex h-2/5 cursor-pointer flex-col justify-center rounded-b-2xl bg-primary p-5 transition-colors duration-200 group-hover:bg-primary-dark"
      >
        <div className="mb-1 flex items-center gap-2">
          {Icon && <Icon className="h-5 w-5 text-accent" />}
          <h3
            className="text-subheader font-semibold text-background"
            title={title} 
          >
            {truncatedTitle}
          </h3>
        </div>
        <p
          className="text-body text-background/80"
          title={description} 
        >
          {truncatedDescription}
        </p>
      </Link>
    </div>
  );
};

export default ChannelCard;
