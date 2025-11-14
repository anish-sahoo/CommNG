import ChannelView from "../components/channel-view";

type ChannelPageProps = {
  params: Promise<{
    channel_id: string;
  }>;
};

// Dynamic channel route that resolves the slug server-side, then hands off rendering to the richer ChannelView client component.
export default async function ChannelPage({ params }: ChannelPageProps) {
  const resolvedParams = await params;
  return <ChannelView channelId={resolvedParams.channel_id} />;
}
