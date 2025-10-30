import Image from "next/image";
import Link from "next/link";
import { type IconName, icons } from "@/components/icons";

interface ChannelCardProps {
  imageSrc?: string;
  title: string;
  description: string;
  iconName: IconName;
  href: string;
}

const ChannelCard: React.FC<ChannelCardProps> = ({
  imageSrc,
  title,
  description,
  iconName,
  href,
}) => {
  const Icon = icons[iconName];

  return (
    <div className="group h-64 w-64 overflow-hidden rounded-2xl border border-neutral/50 bg-white shadow-sm transition-all duration-200 hover:shadow-md">
      <div className="flex h-3/5 items-center justify-center bg-neutral">
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
        href={href}
        className="flex h-2/5 cursor-pointer flex-col justify-center rounded-b-2xl bg-primary p-5 transition-colors duration-200 group-hover:bg-primary-dark"
      >
        <div className="mb-1 flex items-center gap-2">
          {Icon && <Icon className="h-5 w-5 text-accent" />}
          <h3 className="text-subheader font-semibold text-background">
            {title}
          </h3>
        </div>
        <p className="text-body text-background/80">{description}</p>
      </Link>
    </div>
  );
};

export default ChannelCard;
