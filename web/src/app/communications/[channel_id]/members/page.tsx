"use client";

import { skipToken, useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { icons } from "@/components/icons";
import { TitleShell } from "@/components/layouts/title-shell";
import { RemoveMemberModal } from "@/components/modal/remove-member-modal";
import SearchBar from "@/components/search-bar";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { useTRPC } from "@/lib/trpc";

type ChannelMembersPageProps = {
  params: Promise<{
    channel_id: string;
  }>;
};

const UserPlusIcon = icons.personAdd;
const TrashIcon = icons.trash;
const UserIcon = icons.user;

export default function ChannelMembersPage({
  params,
}: ChannelMembersPageProps) {
  const [resolvedParams, setResolvedParams] = useState<{
    channel_id: string;
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [removeModalOpen, setRemoveModalOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<{
    userId: string;
    name: string;
  } | null>(null);

  const trpc = useTRPC();
  const { data: sessionData } = authClient.useSession();
  const currentUserId = sessionData?.user?.id;

  // Resolve params
  useEffect(() => {
    params.then(setResolvedParams);
  }, [params]);

  const channelId = resolvedParams?.channel_id
    ? parseInt(resolvedParams.channel_id, 10)
    : null;

  const channelInput =
    channelId === null || Number.isNaN(channelId) ? skipToken : { channelId };

  // Fetch channel members
  const membersQuery = useQuery(
    trpc.comms.getChannelMembers.queryOptions(channelInput),
  );

  // Fetch channel info to check admin status
  const channelsQuery = useQuery(trpc.comms.getAllChannels.queryOptions());
  const currentChannel = useMemo(() => {
    if (!channelsQuery.data || !channelId) return null;
    return channelsQuery.data.find((ch) => ch.channelId === channelId);
  }, [channelsQuery.data, channelId]);

  const isAdmin =
    currentChannel &&
    "userPermission" in currentChannel &&
    currentChannel.userPermission === "admin";

  // Transform members data
  const members = useMemo(() => {
    if (!membersQuery.data) return [];
    return membersQuery.data.map((member) => ({
      id: member.userId,
      name: member.name,
      rank: member.rank || "",
      role: member.department || member.branch || "",
      isCurrentUser: member.userId === currentUserId,
      userId: member.userId,
      action: member.action,
    }));
  }, [membersQuery.data, currentUserId]);

  // Filter members by search query
  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) return members;
    const query = searchQuery.toLowerCase();
    return members.filter(
      (member) =>
        member.name.toLowerCase().includes(query) ||
        member.rank.toLowerCase().includes(query) ||
        member.role.toLowerCase().includes(query),
    );
  }, [members, searchQuery]);

  // Remove member mutation
  const removeMemberMutation = useMutation(
    trpc.comms.removeMember.mutationOptions(),
  );

  const handleRemoveClick = (member: { userId: string; name: string }) => {
    setMemberToRemove(member);
    setRemoveModalOpen(true);
  };

  const handleRemoveConfirm = async () => {
    if (!memberToRemove || !channelId) return;

    try {
      await removeMemberMutation.mutateAsync({
        channelId,
        userId: memberToRemove.userId,
      });
      toast.success("Member removed", {
        description: `${memberToRemove.name} has been removed from the channel.`,
      });
      // Refetch members
      await membersQuery.refetch();
    } catch (error) {
      toast.error("Failed to remove member", {
        description:
          error instanceof Error ? error.message : "An error occurred",
      });
    }
  };

  const handleClearSearch = () => {
    setSearchQuery("");
  };

  if (!resolvedParams || !channelId) {
    return (
      <TitleShell
        title="Channel Members"
        backHref={`/communications/${resolvedParams?.channel_id || ""}/settings`}
        backAriaLabel="Back to settings"
      >
        <div className="text-secondary/70">Loading...</div>
      </TitleShell>
    );
  }

  return (
    <TitleShell
      title="Channel Members"
      backHref={`/communications/${channelId}/settings`}
      backAriaLabel="Back to settings"
      actions={
        <Button
          variant="outline"
          size="icon"
          className="h-10 w-10 rounded-full"
          aria-label="Add member"
          disabled
        >
          <UserPlusIcon className="h-5 w-5" />
        </Button>
      }
      pinnedContent={
        <div className="flex items-center gap-3 px-1 sm:px-0">
          <SearchBar
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search"
            className="flex-1"
            containerClassName="flex-1"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              onClick={handleClearSearch}
              className="text-secondary"
            >
              Clear
            </Button>
          )}
        </div>
      }
    >
      {membersQuery.isLoading ? (
        <div className="text-secondary/70">Loading members...</div>
      ) : membersQuery.isError ? (
        <div className="text-destructive">
          Failed to load members. Please try again.
        </div>
      ) : filteredMembers.length === 0 ? (
        <div className="text-secondary/70">
          {searchQuery
            ? "No members found matching your search."
            : "No members yet."}
        </div>
      ) : (
        <div className="rounded-3xl bg-primary-dark px-8 py-8">
          <div className="rounded-2xl bg-background px-6 py-6">
            <ul className="max-h-[28rem] divide-y divide-neutral/40 overflow-y-auto pr-4">
              {filteredMembers.map((member) => (
                <li
                  key={member.id}
                  className="flex items-center gap-4 px-6 py-4"
                >
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-primary-dark/30 bg-neutral/20 text-primary">
                    <UserIcon className="h-7 w-7" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-body font-semibold text-secondary">
                        {member.name}
                      </p>
                      {member.isCurrentUser && (
                        <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-primary-foreground">
                          You
                        </span>
                      )}
                    </div>
                    <p className="truncate text-sm italic text-secondary/70">
                      {[member.rank, member.role].filter(Boolean).join(", ")}
                    </p>
                  </div>
                  {isAdmin &&
                    !member.isCurrentUser &&
                    member.action !== "admin" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveClick(member)}
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        aria-label={`Remove ${member.name}`}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <RemoveMemberModal
        open={removeModalOpen}
        onOpenChange={setRemoveModalOpen}
        memberName={memberToRemove?.name || ""}
        onRemove={handleRemoveConfirm}
        isRemoving={removeMemberMutation.isPending}
      />
    </TitleShell>
  );
}
