import type { IconName } from "@repo/lib";
import {
  ArrowUp,
  Axe,
  BookOpen,
  Bug,
  Gift,
  House,
  Map,
  MapPin,
  Megaphone,
  MessageSquareWarning,
  NotepadText,
  ScrollText,
  Server,
  SquareCheckBig,
  Trophy,
  Grid,
  MonitorSmartphone,
  Heart,
  Handshake,
  Newspaper,
  MessageSquare,
  HelpCircle,
  FileText,
  ShieldCheck,
  Fish,
  Bird,
  ChefHat,
  Flower,
  PawPrint,
  Users,
  CloudSun,
} from "lucide-react";

const ICONS = {
  House: House,
  Map: Map,
  Server: Server,
  BookOpen: BookOpen,
  ScrollText: ScrollText,
  ArrowUp: ArrowUp,
  Bug: Bug,
  NotepadText: NotepadText,
  Axe: Axe,
  Gift: Gift,
  MapPin: MapPin,
  Megaphone: Megaphone,
  Trophy: Trophy,
  SquareCheckBig: SquareCheckBig,
  MessageSquareWarning: MessageSquareWarning,
  Grid: Grid,
  MonitorSmartphone: MonitorSmartphone,
  Heart: Heart,
  Handshake: Handshake,
  Newspaper: Newspaper,
  MessageSquare: MessageSquare,
  HelpCircle: HelpCircle,
  FileText: FileText,
  ShieldCheck: ShieldCheck,
  Fish: Fish,
  Bird: Bird,
  ChefHat: ChefHat,
  Flower: Flower,
  PawPrint: PawPrint,
  Users: Users,
  CloudSun: CloudSun,
} as const;

export function NavIcon({
  iconName,
  className,
}: {
  iconName: IconName;
  className?: string;
}) {
  const Icon = ICONS[iconName];
  return <Icon className={className} />;
}
