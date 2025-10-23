"use client";
import { icons } from "@/components/icons";

type ListViewItem = {
  id: string;
  name: string;
  rank: string;
  role: string;
  avatarUrl?: string;
  isCurrentUser?: boolean;
};

// mock data until we get some real users
const fallbackItems: ListViewItem[] = [
  {
    id: "malissa",
    name: "Malissa Zweig",
    rank: "E-5",
    role: "Paralegal Specialist",
    isCurrentUser: true,
  },
  {
    id: "john",
    name: "John Adddams",
    rank: "E-3",
    role: "Firefighter",
  },
  {
    id: "brandon",
    name: "Brandon Johnson",
    rank: "E-1",
    role: "DoorDash Driver",
  },
  {
    id: "catherine",
    name: "Catherine Murray",
    rank: "E-7",
    role: "Director of Human Resources",
  },
  {
    id: "larry",
    name: "Larry Keefe",
    rank: "O-8",
    role: "Adjutant General",
  },
  {
    id: "gary",
    name: "Gary Tomlinson",
    rank: "CWO-4",
    role: "System/IT Admin",
  },
  {
    id: "anna",
    name: "Anna Carpenter",
    rank: "E-6",
    role: "Operations Coordinator",
  },
  {
    id: "darius",
    name: "Darius Fields",
    rank: "E-4",
    role: "Logistics Specialist",
  },
  {
    id: "amanda",
    name: "Amanda Frost",
    rank: "O-3",
    role: "Program Manager",
  },
  {
    id: "roger",
    name: "Roger Thompson",
    rank: "E-7",
    role: "Training Lead",
  },
  {
    id: "maya",
    name: "Maya Chen",
    rank: "E-2",
    role: "Medical Technician",
  },
  {
    id: "veronica",
    name: "Veronica Patel",
    rank: "E-5",
    role: "Community Liaison",
  },
  {
    id: "seth",
    name: "Seth Rivera",
    rank: "E-4",
    role: "Communications Specialist",
  },
  {
    id: "yvette",
    name: "Yvette Morales",
    rank: "O-2",
    role: "Intel Analyst",
  },
];

type ListViewProps = {
  items?: ListViewItem[];
  className?: string;
};

// default avatar until we get some photos
const Avatar = () => (
  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-primary-dark/30 bg-neutral/20 text-primary">
    {(() => {
      const UserIcon = icons.user;
      return <UserIcon className="h-7 w-7" />;
    })()}
  </div>
);

const ListViewRow = ({ item }: { item: ListViewItem }) => {
  return (
    <li className="flex items-center gap-4 px-6 py-4">
      <Avatar />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-body font-semibold text-secondary">
            {item.name}
          </p>
          {item.isCurrentUser ? (
            <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-primary-foreground">
              You
            </span>
          ) : null}
        </div>
        <p className="truncate text-sm italic text-secondary/70">
          {item.rank}, {item.role}
        </p>
      </div>
    </li>
  );
};

export const ListView = ({ items = fallbackItems }: ListViewProps) => {
  if (!items.length) {
    return null;
  }

  return (
    <section className="relative w-full max-w-4xl">
      <div className="rounded-3xl bg-primary-dark px-8 py-8">
        <div className="h-14 rounded-xl" />
        <div className="flex flex-col gap-6 rounded-2xl bg-background px-6 py-6">
          <div className="relative overflow-hidden rounded-xl bg-background">
            <ul className="max-h-[28rem] overflow-y-auto divide-y divide-neutral/40 pr-4">
              {items.map((item) => (
                <ListViewRow key={item.id} item={item} />
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ListView;
