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
    <div className="group w-64 h-64 rounded-2xl overflow-hidden bg-white border border-neutral/50 shadow-sm hover:shadow-md transition-all duration-200">
      <div className="h-3/5 bg-neutral flex items-center justify-center">
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={title}
            className="w-full h-full object-cover"
            width={300}
            height={200}
          />
        ) : (
          <span className="text-secondary/50 text-body">Image Placeholder</span>
        )}
      </div>

      <Link
        href={href}
        className="h-2/5 bg-primary group-hover:bg-primary-dark transition-colors duration-200 p-5 flex flex-col justify-center rounded-b-2xl cursor-pointer"
      >
        <div className="flex items-center gap-2 mb-1">
          {Icon && <Icon className="w-5 h-5 text-accent" />}
          <h3 className="text-subheader text-background font-semibold">
            {title}
          </h3>
        </div>
        <p className="text-body text-background/80">{description}</p>
      </Link>
    </div>
  );
};

export default ChannelCard;
