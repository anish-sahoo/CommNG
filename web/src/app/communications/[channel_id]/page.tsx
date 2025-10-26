import ChannelView from "../components/channel-view";

type ChannelPageProps = {
  params: {
    channel_id: string;
  };
};

export default function ChannelPage({ params }: ChannelPageProps) {
  return <ChannelView channelId={params.channel_id} />;
}
