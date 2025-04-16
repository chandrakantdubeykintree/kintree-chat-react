// frontend/src/components/chats/ChatListItem.jsx
import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { format, isToday, isYesterday, parseISO } from "date-fns";
import {
  Check,
  CheckCheck,
  File,
  Image as ImageIcon,
  Gift,
  Mic,
  Video,
  StickyNote,
} from "lucide-react";
import { cn } from "@/lib/utils";
import useChatStore from "./useChatStore";

// Helper functions (formatChatListTime, getMessagePreview) remain the same as previous version
const formatChatListTime = (dateString) => {
  if (!dateString) return "";
  try {
    const date = parseISO(dateString);
    if (isToday(date)) return format(date, "h:mm a");
    if (isYesterday(date)) return "Yesterday";
    return format(date, "M/d/yy");
  } catch (error) {
    return "";
  }
};
const getMessagePreview = (messageData) => {
  // ... (implementation from previous answer) ...
  if (!messageData) return { text: "No messages yet", icon: null };
  if (messageData.attachments && messageData.attachments.length > 0) {
    const firstAttachment = messageData.attachments[0];
    const mimeType = firstAttachment?.mime_type || "";
    const fileName = firstAttachment?.file_name || "";
    if (mimeType.startsWith("image/"))
      return {
        text: "Photo",
        icon: (
          <ImageIcon
            size={14}
            className="inline mr-1 text-muted-foreground flex-shrink-0"
          />
        ),
      };
    if (mimeType.startsWith("video/"))
      return {
        text: "Video",
        icon: (
          <Video
            size={14}
            className="inline mr-1 text-muted-foreground flex-shrink-0"
          />
        ),
      };
    if (mimeType.startsWith("audio/"))
      return {
        text: "Audio",
        icon: (
          <Mic
            size={14}
            className="inline mr-1 text-muted-foreground flex-shrink-0"
          />
        ),
      };
    if (fileName.endsWith(".gif"))
      return {
        text: "GIF",
        icon: (
          <Gift
            size={14}
            className="inline mr-1 text-muted-foreground flex-shrink-0"
          />
        ),
      };
    // Add sticker check if possible
    return {
      text: "Attachment",
      icon: (
        <File
          size={14}
          className="inline mr-1 text-muted-foreground flex-shrink-0"
        />
      ),
    };
  }
  return { text: messageData.message || "Message", icon: null };
};

const ChatListItem = ({ channel, isActive, onClick }) => {
  const {
    name,
    thumbnail_image_url,
    latest_message,
    unread_message_count,
    // is_online, // (Removed from display)
  } = channel;

  // Get typing status for this specific channel
  const typingUser = useChatStore((state) => state.typingStatus[channel.id]);

  const fallbackName = name?.substring(0, 1).toUpperCase() || "?";
  const displayTime = formatChatListTime(latest_message?.created_at);
  const { text: previewText, icon: previewIcon } =
    getMessagePreview(latest_message);

  const isUnread =
    unread_message_count > 0 && !latest_message?.message_sent_by_me;

  let statusIcon = null;
  if (latest_message?.message_sent_by_me) {
    if (latest_message.read_at)
      statusIcon = (
        <CheckCheck size={16} className="text-blue-500 flex-shrink-0 mr-1" />
      );
    else if (latest_message.delivered_at)
      statusIcon = (
        <CheckCheck
          size={16}
          className="text-muted-foreground flex-shrink-0 mr-1"
        />
      );
    else if (latest_message.id)
      statusIcon = (
        <Check size={16} className="text-muted-foreground flex-shrink-0 mr-1" />
      );
  }

  let previewContent; // Will hold either message preview or typing indicator

  if (typingUser) {
    // Show typing indicator - prioritize this
    previewContent = (
      <span className="text-sm text-green-600 dark:text-green-500 truncate italic">
        typing...
      </span> // WhatsApp style typing indicator
    );
    // No status icon needed when showing typing indicator
  } else {
    // Show latest message preview if not typing
    const { text: previewText, icon: previewIcon } =
      getMessagePreview(latest_message);
    previewContent = (
      <>
        {/* Use fragment to group icon + text */}
        {previewIcon}
        <p
          className={cn(
            "text-sm truncate",
            isUnread ? "text-foreground" : "text-muted-foreground"
          )}
          title={latest_message?.message}
        >
          {previewText}
        </p>
      </>
    );
    // Determine status icon only if showing message preview
    if (latest_message?.message_sent_by_me) {
      if (latest_message.read_at)
        statusIcon = (
          <CheckCheck size={16} className="text-blue-500 flex-shrink-0 mr-1" />
        );
      else if (latest_message.delivered_at)
        statusIcon = (
          <CheckCheck
            size={16}
            className="text-muted-foreground flex-shrink-0 mr-1"
          />
        );
      else if (latest_message.id)
        statusIcon = (
          <Check
            size={16}
            className="text-muted-foreground flex-shrink-0 mr-1"
          />
        );
    }
  }

  return (
    <div
      // Use py-2 instead of py-2.5 for slightly less height
      className={cn(
        "flex items-center px-3 py-2 gap-3 hover:bg-accent cursor-pointer",
        isActive ? "bg-muted" : "bg-background"
      )}
      onClick={onClick}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <Avatar className="h-12 w-12">
          <AvatarImage src={thumbnail_image_url} alt={name} />
          <AvatarFallback>{fallbackName}</AvatarFallback>
        </Avatar>
      </div>

      {/* Main Content Area - Takes remaining space */}
      {/* Crucially add overflow-hidden here to contain its children */}
      <div className="flex-1 min-w-0 overflow-hidden">
        {/* Top Row: Name and Time */}
        {/* Use grid for more control over column sizing and preventing push-out */}
        <div className="grid grid-cols-[1fr_auto] items-center mb-0.5">
          {/* Name takes available space and truncates */}
          <p className="text-base font-normal text-foreground truncate pr-1">
            {name}
          </p>
          {/* Time stays in its auto-sized column */}
          <p
            className={cn(
              "text-xs flex-shrink-0 justify-self-end", // Align time to the end of its column
              isUnread
                ? "text-green-600 dark:text-green-500 font-medium"
                : "text-muted-foreground"
            )}
          >
            {displayTime}
          </p>
        </div>

        {/* Bottom Row: Preview and Badge */}
        {/* Use grid here too */}
        <div className="grid grid-cols-[1fr_auto] items-center h-5">
          {/* Left side: Icon + Text Preview - takes available space and truncates */}
          {/* <div className="flex items-center space-x-1 min-w-0 overflow-hidden pr-1">
            
            {statusIcon}
            {previewIcon}
            <p
              className={cn(
                "text-sm truncate",
                isUnread ? "text-foreground" : "text-muted-foreground"
              )}
              title={latest_message?.message}
            >
              {previewText}
            </p>
          </div> */}
          <div className="flex items-center space-x-1 min-w-0 overflow-hidden pr-1">
            {/* Status icon shown only when NOT typing */}
            {!typingUser && statusIcon}
            {/* Render the determined content (message preview or typing...) */}
            {previewContent}
          </div>

          {/* Right side: Badge - stays in its auto-sized column */}
          {isUnread && (
            <Badge
              variant="default"
              className="h-5 min-w-[1.25rem] px-1 text-xs flex items-center justify-center flex-shrink-0 rounded-full bg-green-600 hover:bg-green-700 text-white justify-self-end" // Align badge to end
            >
              {unread_message_count}
            </Badge>
          )}
          {/* If no badge, ensure the grid column still exists (or adjust grid template) */}
          {/* {!isUnread && <div className="w-5 h-5 flex-shrink-0 justify-self-end"></div>} */}
        </div>
      </div>
    </div>
  );
};

export default ChatListItem;
