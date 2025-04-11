import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ICON_NOTIFICATION } from "@/constants/iconUrls";
import { CardDescription, CardTitle } from "./ui/card";
import { useNotifications } from "@/hooks/useNotifications";
import { NavLink } from "react-router";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function NotificationDropDown() {
  const { t } = useTranslation();
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    isMarkingAllAsRead,
  } = useNotifications(10); // Limit to 5 notifications

  const handleNotificationClick = (notification) => {
    if (!notification.readed_at) {
      markAsRead(notification.id);
    }
  };
  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };

  const NotificationItem = ({ notification }) => {
    const { notification_data, readed_at } = notification;
    const { notified_by, message } = notification_data;

    return (
      <DropdownMenuItem
        className="cursor-pointer"
        onClick={() => handleNotificationClick(notification)}
      >
        <div className="flex items-start gap-3 py-2 w-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={notified_by?.profile_pic_url} />
            <AvatarFallback>
              {notified_by?.first_name?.charAt(0)}
              {notified_by?.last_name?.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-1">
            <p className={`text-sm ${!readed_at ? "font-normal" : ""}`}>
              {message}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              @{notified_by?.username}
            </p>
          </div>
          {!readed_at && (
            <div className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0" />
          )}
        </div>
      </DropdownMenuItem>
    );
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild className="relative">
        <div className="relative cursor-pointer">
          <img
            src={ICON_NOTIFICATION}
            className="w-6 h-6 transform transition-transform duration-300 ease-in-out hover:scale-125"
            alt="Notifications"
          />
          {
            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 text-[10px] font-bold text-white flex items-center justify-center bg-red-500 rounded-full">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          }
        </div>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-[275px]" align="end">
        <div className="p-4 space-y-2">
          <CardTitle className="self-start">{t("notifications")}</CardTitle>
          <CardDescription>
            {t("you_have")} {unreadCount}{" "}
            {t(
              unreadCount !== 1 ? "unread_notifications" : "unread_notification"
            )}
          </CardDescription>
          <button
            className="px-2 flex justify-center items-center bg-primary py-1 text-white text-xs rounded-full cursor-pointer mx-auto disabled:opacity-70"
            onClick={handleMarkAllAsRead}
            disabled={isMarkingAllAsRead || unreadCount < 1}
          >
            {isMarkingAllAsRead ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              t("mark_all_as_read")
            )}
          </button>
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuGroup className="max-h-[400px] overflow-y-auto no_scrollbar">
          {isLoading ? (
            <div className="flex justify-center items-center py-4">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : unreadCount > 0 ? (
            notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
              />
            ))
          ) : (
            <div className="py-4 text-center text-sm text-muted-foreground">
              {t("no_notifications")}
            </div>
          )}
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild className="flex justify-center">
          <NavLink
            to="/notifications"
            className="w-full text-center py-2 text-sm text-primary hover:text-primary/80 cursor-pointer font-semibold"
          >
            {t("view_all_notifications")}
          </NavLink>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
