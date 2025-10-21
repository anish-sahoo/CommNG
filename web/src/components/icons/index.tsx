import {
  Bars3Icon,
  BellAlertIcon,
  ChatBubbleBottomCenterTextIcon,
  ChatBubbleLeftEllipsisIcon,
  ChatBubbleLeftRightIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Cog6ToothIcon,
  EllipsisVerticalIcon,
  LockClosedIcon,
  MagnifyingGlassIcon,
  MegaphoneIcon,
  PencilSquareIcon,
  PlusIcon,
  TrashIcon,
  UserPlusIcon,
  XMarkIcon,
} from "@heroicons/react/24/solid";
import type { ComponentType, SVGProps } from "react";

type HeroIcon = ComponentType<SVGProps<SVGSVGElement>>;

const ToggleOffIcon: HeroIcon = ({ className, ...props }) => (
  <svg
    viewBox="0 0 48 24"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
    focusable="false"
    {...props}
  >
    <rect
      x="1"
      y="1"
      width="46"
      height="22"
      rx="11"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    />
    <circle cx="12" cy="12" r="8" fill="currentColor" />
  </svg>
);

const ToggleOnIcon: HeroIcon = ({ className, ...props }) => (
  <svg
    viewBox="0 0 48 24"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
    focusable="false"
    {...props}
  >
    <rect
      x="1"
      y="1"
      width="46"
      height="22"
      rx="11"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="2"
    />
    <circle cx="36" cy="12" r="8" fill="#FFFFFF" />
  </svg>
);

export const icons = {
  search: MagnifyingGlassIcon,
  edit: PencilSquareIcon,
  add: PlusIcon,
  addAlert: BellAlertIcon,
  settings: Cog6ToothIcon,
  personAdd: UserPlusIcon,
  arrowLeft: ChevronLeftIcon,
  arrowRight: ChevronRightIcon,
  announce: MegaphoneIcon,
  forum: ChatBubbleLeftRightIcon,
  menu: Bars3Icon,
  trash: TrashIcon,
  text: ChatBubbleLeftEllipsisIcon,
  clear: XMarkIcon,
  arrowDown: ChevronDownIcon,
  done: CheckIcon,
  lock: LockClosedIcon,
  toggleOff: ToggleOffIcon,
  toggleOn: ToggleOnIcon,
  message: ChatBubbleBottomCenterTextIcon,
  ellipsis: EllipsisVerticalIcon,
} satisfies Record<string, HeroIcon>;

export type IconName = keyof typeof icons;

export type IconDescriptor = {
  name: string;
  icon: HeroIcon;
  usage: string;
  token: IconName;
};

export const iconCatalog: IconDescriptor[] = [
  {
    name: "Search",
    icon: icons.search,
    usage: "Search inputs, top nav search, command palette triggers.",
    token: "search",
  },
  {
    name: "Edit",
    icon: icons.edit,
    usage: "Inline editing, form edit states, quick actions.",
    token: "edit",
  },
  {
    name: "Add",
    icon: icons.add,
    usage: "Primary create actions, add buttons, fab actions.",
    token: "add",
  },
  {
    name: "Add Alert",
    icon: icons.addAlert,
    usage: "Notifications, alert creation, subscriptions.",
    token: "addAlert",
  },
  {
    name: "Settings",
    icon: icons.settings,
    usage: "Preferences, configuration panels, gear menus.",
    token: "settings",
  },
  {
    name: "Person Add",
    icon: icons.personAdd,
    usage: "User invites, share modals, participant management.",
    token: "personAdd",
  },
  {
    name: "Ellipsis",
    icon: icons.ellipsis,
    usage: "Overflow menus, loading states, more indicator.",
    token: "ellipsis",
  },
  {
    name: "Arrow Left",
    icon: icons.arrowLeft,
    usage: "Back navigation, pagination, carousels.",
    token: "arrowLeft",
  },
  {
    name: "Arrow Right",
    icon: icons.arrowRight,
    usage: "Forward navigation, pagination, carousels.",
    token: "arrowRight",
  },
  {
    name: "Announce",
    icon: icons.announce,
    usage: "Broadcast messages, campaign updates, banners.",
    token: "announce",
  },
  {
    name: "Forum",
    icon: icons.forum,
    usage: "Discussion threads, chat experiences, forums.",
    token: "forum",
  },
  {
    name: "Menu",
    icon: icons.menu,
    usage: "Hamburger menu, overflow actions, navigation drawers.",
    token: "menu",
  },
  {
    name: "Trash",
    icon: icons.trash,
    usage: "Delete actions, archive flows, destructive confirmations.",
    token: "trash",
  },
  {
    name: "Message",
    icon: icons.message,
    usage: "Messaging, comments, timeline items.",
    token: "message",
  },
  {
    name: "Clear",
    icon: icons.clear,
    usage: "Dismiss actions, modal close, input clear buttons.",
    token: "clear",
  },
  {
    name: "Arrow Down",
    icon: icons.arrowDown,
    usage: "Dropdown menus, collapsible content, sorting.",
    token: "arrowDown",
  },
  {
    name: "Done",
    icon: icons.done,
    usage: "Completion states, success confirmations, checklists.",
    token: "done",
  },
  {
    name: "Lock",
    icon: icons.lock,
    usage: "Security, permissions, protected resources.",
    token: "lock",
  },
  {
    name: "Toggle Off",
    icon: icons.toggleOff,
    usage: "Forms and settings toggle - inactive state.",
    token: "toggleOff",
  },
  {
    name: "Toggle On",
    icon: icons.toggleOn,
    usage: "Forms and settings toggle - active state.",
    token: "toggleOn",
  },
];
