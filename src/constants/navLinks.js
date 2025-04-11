import ForeroomIcon from "@/components/custom-icons/foreroomIcon";
import {
  ICON_DELETE,
  ICON_EDIT,
  ICON_SETTINGS,
  ICON_USERNAME,
} from "./iconUrls";
import FamilyTreeIcon from "@/components/custom-icons/familyTreeIcon";
import DnaIcon from "@/components/custom-icons/dnaIcon";
import EventsIcon from "@/components/custom-icons/eventsIcon";
import NotificationsIcon from "@/components/custom-icons/notificationsIcon";
import WillIcon from "@/components/custom-icons/willIcon";
import ProfileIcon from "@/components/custom-icons/profileIcon";
import SettingsIcon from "@/components/custom-icons/settingsIcon";
import KincoinsIcon from "@/components/custom-icons/kincoinsIcon";
import ChatsIcon from "@/components/custom-icons/chatsIcon";
import astrologyIcon from "@/components/custom-icons/astrologyIcon";

export const mainNavLinks = [
  { path: "/foreroom", label: "foreroom", Icon: ForeroomIcon },
  { path: "/familytree", label: "family_tree", Icon: FamilyTreeIcon },
  { path: "/chats", label: "chats", Icon: ChatsIcon },
  {
    path: "/astrology",
    label: "astrology",
    Icon: astrologyIcon,
  },
  { path: "https://kintree.com/dna/", label: "dna", Icon: DnaIcon },
  { path: "/events", label: "events", Icon: EventsIcon },
  { path: "/kin-coins", label: "kincoins", Icon: KincoinsIcon },
  { path: "/notifications", label: "notifications", Icon: NotificationsIcon },
  { path: "/will", label: "kin_will", Icon: WillIcon },
  { path: "/profile", label: "profile", Icon: ProfileIcon },
  { path: "/settings", label: "settings", Icon: SettingsIcon },
];

export const profileMenuItems = [
  { path: "/profile", label: "profile", icon: ICON_USERNAME },
  { path: "/settings", label: "settings", icon: ICON_SETTINGS },
];

export const publicLinks = [
  { path: "/blogs", label: "blog", icon: "" },
  { path: "/about", label: "about", icon: "" },
  { path: "/login", label: "login", icon: "" },
  { path: "/signup", label: "signup", icon: "" },
];

export const postDropDown = [
  { path: "editpost", label: "edit", icon: ICON_EDIT },
  { path: "delete", label: "delete", icon: ICON_DELETE },
];

export const recipeDropDown = [
  { path: "editrecipe", label: "edit", icon: ICON_EDIT },
  { path: "delete", label: "delete", icon: ICON_DELETE },
];
