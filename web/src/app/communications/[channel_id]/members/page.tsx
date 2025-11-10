import { TitleShell } from "@/components/layouts/title-shell";

type ChannelMembersPageProps = {
  params: Promise<{
    channel_id: string;
  }>;
};

export default async function ChannelMembersPage({
  params,
}: ChannelMembersPageProps) {
  const { channel_id: channelId } = await params;

  return (
    <TitleShell
      title="Channel Members"
      backHref={`/communications/${channelId}/settings`}
      backAriaLabel="Back to settings"
    >
      <section className="rounded-2xl border border-dashed border-primary/30 bg-card p-8 text-secondary/70">
        <p>Channel members will appear here.</p>
      </section>
    </TitleShell>
  );
}
