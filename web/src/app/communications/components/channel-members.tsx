export type ChannelMember = {
  id: string;
  name: string;
  rank?: string | null;
  role?: string | null;
  isCurrentUser?: boolean;
};

type ChannelMembersProps = {
  members: ChannelMember[];
};

export function ChannelMembers({ members }: ChannelMembersProps) {
  if (!members.length) {
    return <p className="text-sm text-secondary/70">No members yet.</p>;
  }

  return (
    <ul className="flex flex-col gap-3">
      {members.map((member) => (
        <li
          key={member.id}
          className="flex flex-col gap-1 rounded-xl border border-border bg-background/40 p-3"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold text-secondary">
              {member.name}
            </span>
            {member.isCurrentUser ? (
              <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-foreground">
                You
              </span>
            ) : null}
          </div>
          <span className="text-xs text-secondary">
            {[member.rank, member.role].filter(Boolean).join(" · ")}
          </span>
        </li>
      ))}
    </ul>
  );
}

export default ChannelMembers;
