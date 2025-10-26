import Link from "next/link";
import { icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { ChannelShell } from "../../components";

type NewChannelPostPageProps = {
  params: { channel_id: string };
};

export default function NewChannelPostPlaceholder({
  params,
}: NewChannelPostPageProps) {
  const ArrowLeftIcon = icons.arrowLeft;
  const channelId = params.channel_id;

  return (
    <ChannelShell
      title={
        <div className="flex items-center gap-3 sm:gap-4">
          <Link
            href={`/communications/${channelId}`}
            className="inline-flex h-12 w-12 items-center justify-center text-accent transition hover:text-accent/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 sm:h-14 sm:w-14"
            aria-label="Back to channels"
          >
            <ArrowLeftIcon className="h-7 w-7 sm:h-8 sm:w-8" />
          </Link>
          <span className="text-[1.75rem] font-semibold leading-tight text-secondary sm:text-[2.25rem]">
            Compose New Post
          </span>
        </div>
      }
    >
      <section className="rounded-2xl border border-dashed border-primary/30 bg-card p-8 text-secondary/70">
        <div className="space-y-4 text-left">
          <p>
            We&apos;re putting the finishing touches on the post composer for
            channel updates. Soon you&apos;ll be able to draft updates, attach
            files, and share announcements with your teams right from this
            screen.
          </p>
          <p className="text-sm text-secondary/60">
            Until then, keep an eye on the conversations or circle back later
            when the posting tools are live.
          </p>
          <div className="pt-4">
            <Button variant="outline" asChild>
              <Link href={`/communications/${channelId}`}>Back to Channel</Link>
            </Button>
          </div>
        </div>
      </section>
    </ChannelShell>
  );
}
