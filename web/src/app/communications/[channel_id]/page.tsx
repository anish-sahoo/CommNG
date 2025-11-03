import ChannelView from "../components/channel-view";

type ChannelPageProps = {
  params: Promise<{
    channel_id: string;
  }>;
};

export default async function ChannelPage({ params }: ChannelPageProps) {
  const resolvedParams = await params;
  return <ChannelView channelId={resolvedParams.channel_id} />;
}
