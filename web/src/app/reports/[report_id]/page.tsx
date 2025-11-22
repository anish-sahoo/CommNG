import ChannelView from "@/app/communications/components/channel-view";

type EditReportsPageProps = {
  params: Promise<{
    report_id: string;
  }>;
};

// Dynamic channel route that resolves the slug server-side, then hands off rendering to the richer ChannelView client component.
export default async function EditReportsPage({ params }: EditReportsPageProps) {
  const resolvedParams = await params;
  return <ChannelView channelId={resolvedParams.report_id} />;
}
