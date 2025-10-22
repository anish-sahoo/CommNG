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
import { Megaphone, MessageSquareWarning, User, Users } from "lucide-react";
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
  communications: Megaphone,
  mentorship: Users,
  reports: MessageSquareWarning,
  user: User,
} satisfies Record<string, HeroIcon>;

export type IconName = keyof typeof icons;
