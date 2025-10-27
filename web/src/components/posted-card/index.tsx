"use client";
import { icons } from "@/components/icons";
import { Card } from "@/components/ui/card";

type PostedCardProps = {
  avatarUrl?: string;
  name: string;
  rank: string;
  content: string;
  attachmentUrl?: string;
};

const UserIcon = icons.user;

const Avatar = () => (
  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-primary-dark/30 bg-neutral/20 text-primary">
    <UserIcon className="h-7 w-7" />
  </div>
);

export const PostedCard = ({
  name,
  rank,
  content,
  attachmentUrl,
}: PostedCardProps) => {
  return (
    <Card className="w-full p-4">
      <div className="flex items-center gap-4 px-6 py-4">
        <Avatar />
        <div className="flex flex-col gap-2 px-4 py-0 w-full">
          <div className="text-secondary text-subheader font-semibold">
            {name}
            <div className="text-secondary text-sm font-semibold italic">
              {rank}
            </div>
          </div>
          <div className="text-secondary text-sm font-normal">{content}</div>
          {attachmentUrl ? (
            <a
              href={attachmentUrl}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-semibold text-accent transition hover:text-accent/80"
            >
              View attachment
            </a>
          ) : null}
        </div>
      </div>
    </Card>
  );
};

export default PostedCard;
