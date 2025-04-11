import { NavLink, useLocation } from "react-router";
import { mainNavLinks } from "../constants/navLinks";
import { Card } from "./ui/card";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { useUnreadMessages } from "@/hooks/useChannels";
import { useNotifications } from "@/hooks/useNotifications";
import { tokenService } from "@/services/tokenService";

export default function SecondaryNavigation() {
  const location = useLocation();
  const { t } = useTranslation();
  const [hoveredPath, setHoveredPath] = useState(null);
  const { data: unreadMessages } = useUnreadMessages();
  const unreadedMessageCount = unreadMessages?.data?.unreaded_message_count;
  const token = tokenService.getLoginToken();
  const { unreadCount } = useNotifications(10);

  return (
    <Card className="w-full max-w-sm mx-auto shadow-sm border-0 rounded-2xl overflow-hidden">
      <div className="flex flex-col gap-2 p-4">
        {mainNavLinks.map(({ path, label, Icon }) => (
          <NavLink
            key={path}
            to={path === "/chats" ? `/chats/${token}` : path}
            onMouseEnter={() => setHoveredPath(path)}
            onMouseLeave={() => setHoveredPath(null)}
            className={`flex items-center justify-between h-12 font-medium px-4 rounded-xl text-base bg-gray-50 dark:bg-gray-800 ${
              location?.pathname.includes(path)
                ? "bg-primary text-white hover:bg-primary dark:bg-primary dark:bg-primary/90"
                : "hover:bg-primary/90 hover:text-white dark:hover:bg-primary/90 dark:hover:text-white"
            } `}
          >
            <div className="flex items-center gap-2">
              {Icon && (
                <Icon
                  className="h-6 w-6"
                  strokeColor={
                    location?.pathname.includes(path) || hoveredPath === path
                      ? "#ffffff"
                      : undefined
                  }
                />
              )}
              <span className="text-sm">{t(label)}</span>
            </div>
            {path === "/chats" && (
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-red-500 p-2">
                <span className="text-xs text-white">
                  {unreadedMessageCount > 99
                    ? "99+"
                    : unreadedMessageCount || 0}
                </span>
              </div>
            )}
            {path === "/notifications" && (
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-red-500 p-2">
                <span className="text-xs text-white">
                  {unreadCount > 99 ? "99+" : unreadCount || 0}
                </span>
              </div>
            )}
          </NavLink>
        ))}
      </div>
    </Card>
  );
}
