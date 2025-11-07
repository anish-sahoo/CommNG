import Link from "next/link";
import { icons } from "@/components/icons";
import { ChannelShell } from "../../components/channel-shell";

type ChannelMembersPageProps = {
  params: {
    channel_id: string;
  };
};

export default function ChannelMembersPage({
  params,
}: ChannelMembersPageProps) {
  const ArrowLeftIcon = icons.arrowLeft;
  const channelId = params.channel_id;

  return (
    <ChannelShell
      title={
        <div className="flex items-center gap-3 sm:gap-4">
          <Link
            href={`/communications/${channelId}/settings`}
            className="inline-flex h-12 w-12 items-center justify-center text-accent transition hover:text-accent/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 sm:h-14 sm:w-14"
            aria-label="Back to settings"
          >
            <ArrowLeftIcon className="h-7 w-7 sm:h-8 sm:w-8" />
          </Link>
          <span className="text-[1.75rem] font-semibold leading-tight text-secondary sm:text-[2.25rem]">
            Channel Members
          </span>
        </div>
      }
    >
      <section className="rounded-2xl border border-dashed border-primary/30 bg-card p-8 text-secondary/70">
        <p>Channel members will appear here.</p>
      </section>
    </ChannelShell>
  );
}
