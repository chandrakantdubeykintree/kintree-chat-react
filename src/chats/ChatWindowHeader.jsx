// frontend/src/components/chats/ChatWindowHeader.jsx
import React, { useMemo, useState } from "react"; // Import useMemo
import {
  ArrowLeft,
  Trash2,
  X,
  Pencil,
  MoreVertical,
  Info,
  MessageCircleOff,
  UserX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import useChatStore from "./useChatStore";
import {
  emitDeleteMessage,
  emitClearChat,
  emitDeleteChannel,
} from "./socketService";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// Helper to initiate delete with confirmation (keep as is)
const confirmAndDeleteMessages = async (channelId, messageIds) => {
  // ... (implementation from previous step) ...
  if (!channelId || messageIds.length === 0) return;
  if (
    window.confirm(
      `Are you sure you want to delete ${messageIds.length} message(s)?`
    )
  ) {
    const promises = messageIds.map((messageId) =>
      emitDeleteMessage(channelId, messageId)
    );
    try {
      await toast.promise(Promise.all(promises), {
        loading: `Deleting ${messageIds.length} message(s)...`,
        success: `Deleted ${messageIds.length} message(s)!`,
        error: (err) =>
          `Failed to delete some messages. Error: ${
            err?.message || "Unknown error"
          }`,
      });
      return true; // Indicate success
    } catch (error) {
      console.error("Error initiating delete:", error);
      return false; // Indicate failure
    }
  }
  return false; // User cancelled
};

const ChatWindowHeader = ({ channel, onBack, onViewContactInfo }) => {
  // --- Refactored Store Selection ---
  const activeChannelId = useChatStore((state) => state.activeChannelId);
  const selectedMessagesMap = useChatStore((state) => state.selectedMessages); // Select the whole map
  const isSelecting = useChatStore((state) => state.isSelecting);
  const clearSelection = useChatStore((state) => state.clearSelection); // Select the function
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const typingUser = useChatStore(
    (state) => state.typingStatus[activeChannelId]
  );

  const handleViewInfo = () => {
    console.log(onViewContactInfo);

    if (onViewContactInfo && channel) {
      console.log("clicked from viewinfo");
      onViewContactInfo(channel); // Pass the current channel data up
    }
  };

  // --- Derive selectedMessages for the current channel ---
  const selectedMessages = useMemo(() => {
    // Provide an empty Set as fallback if activeChannelId is null or map entry doesn't exist
    return selectedMessagesMap[activeChannelId] || new Set();
  }, [selectedMessagesMap, activeChannelId]); // Dependencies: the map and the current channel ID
  // --- End Refactoring ---

  // --- Event Handlers ---
  const handleClearSelection = () => {
    // Pass the activeChannelId to the store action
    if (activeChannelId) {
      clearSelection(activeChannelId);
    }
  };

  const handleDeleteSelected = async () => {
    if (!activeChannelId || selectedMessages.size === 0) return;

    // Confirmation logic moved inside the AlertDialog action
    const messageIdsToDelete = Array.from(selectedMessages);
    const promises = messageIdsToDelete.map((messageId) =>
      emitDeleteMessage(activeChannelId, messageId)
    );
    try {
      await toast.promise(Promise.all(promises), {
        loading: `Deleting ${messageIdsToDelete.length} message(s)...`,
        success: (results) => {
          clearSelection(activeChannelId); // Clear selection on success
          return `${messageIdsToDelete.length} message(s) deleted!`;
        },
        error: (err) =>
          `Failed to delete some messages. Error: ${
            err?.message || "Unknown error"
          }`,
      });
    } catch (error) {
      console.error("Error initiating delete:", error);
      // Toast handles error display
    }
    setShowDeleteConfirm(false); // Close dialog after action
  };

  const handleClearChat = () => {
    if (!activeChannelId) return;
    if (
      window.confirm(
        "Are you sure you want to clear all messages in this chat? This cannot be undone."
      )
    ) {
      toast.promise(emitClearChat(activeChannelId), {
        loading: "Clearing chat...",
        success: "Chat cleared successfully!",
        error: (err) =>
          `Failed to clear chat: ${err?.message || "Unknown error"}`,
      });
    }
  };

  const handleDeleteChat = () => {
    if (!activeChannelId) return;
    const confirmText = channel?.is_group
      ? "delete this group"
      : "delete this chat";
    if (
      window.confirm(
        `Are you sure you want to ${confirmText}? This will remove the chat for you (and potentially others if you are the admin of a group).`
      )
    ) {
      toast.promise(emitDeleteChannel(activeChannelId), {
        loading: "Deleting chat...",
        success: "Chat deleted request sent.",
        error: (err) =>
          `Failed to delete chat: ${err?.message || "Unknown error"}`,
      });
    }
  };

  // --- Rendering (Using derived selectedMessages Set) ---
  if (!channel && !activeChannelId) {
    return (
      <div className="flex items-center p-3 border-b h-[69px] bg-background">
        <p className="text-muted-foreground">Select a chat</p>
      </div>
    );
  }
  if (!channel && activeChannelId) {
    // Show loading placeholder if channel data isn't ready
    return (
      <div className="flex items-center p-3 border-b h-[69px] bg-background">
        <Button
          variant="ghost"
          size="icon"
          className="mr-2 md:hidden"
          onClick={onBack}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center space-x-3 animate-pulse">
          <div className="h-10 w-10 rounded-full bg-muted"></div>
          <div className="space-y-1">
            <div className="h-4 w-24 rounded bg-muted"></div>
            <div className="h-3 w-16 rounded bg-muted"></div>
          </div>
        </div>
      </div>
    );
  }

  // Channel data is available
  // ... loading/placeholder states ...
  const fallbackName = channel?.name?.substring(0, 1).toUpperCase() || "?";
  const isGroup = channel?.is_group === 1;

  // Determine subtitle: Typing > Online > Offline/LastSeen
  let subtitle = "Offline"; // Default
  if (typingUser) {
    subtitle = (
      <span className="italic text-green-600 dark:text-green-500">
        {isGroup ? `${typingUser.userName} is typing...` : "typing..."}
      </span>
    );
  } else if (channel?.is_online) {
    subtitle = "Online";
  } else if (channel?.last_seen_at) {
    // TODO: Add last seen formatting logic if backend provides last_seen_at
    // subtitle = `Last seen ${formatDistanceToNowStrict(...) }`;
  }

  return (
    <>
      {/* --- Delete Confirmation Dialog --- */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        {/* Trigger is handled programmatically below */}
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Message(s)?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedMessages.size} selected
              message(s)? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            {/* Call the actual delete logic on confirmation */}
            <AlertDialogAction
              onClick={handleDeleteSelected}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <div className="flex items-center justify-between p-3 border-b bg-background h-[69px]">
        <div
          className="flex items-center space-x-3 min-w-0"
          onClick={!isSelecting && !typingUser ? handleViewInfo : undefined}
        >
          <Button
            variant="ghost"
            size="icon"
            className="mr-2 md:hidden flex-shrink-0"
            onClick={onBack}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          {isSelecting ? (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClearSelection}
                title="Cancel Selection"
                className="flex-shrink-0"
              >
                <X className="h-5 w-5" />
              </Button>
              {/* Use the derived selectedMessages Set's size */}
              <span className="font-medium text-sm truncate">
                {selectedMessages.size} selected
              </span>
            </>
          ) : (
            <>
              <Avatar className="h-10 w-10 flex-shrink-0">
                <AvatarImage
                  src={channel.thumbnail_image_url}
                  alt={channel.name}
                />
                <AvatarFallback>{fallbackName}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col min-w-0">
                <span className="font-semibold text-sm truncate">
                  {channel.name}
                </span>
                <span className="text-xs text-muted-foreground truncate">
                  {subtitle}
                </span>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center space-x-1 flex-shrink-0">
          {isSelecting ? (
            <>
              {/* Use the derived selectedMessages Set's size */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowDeleteConfirm(true)} // Open dialog
                title="Delete Selected"
                disabled={selectedMessages.size === 0}
              >
                <Trash2 className="h-5 w-5 text-destructive" />
              </Button>
            </>
          ) : (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" title="More options">
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem
                    onClick={() => {
                      console.log("clicked view info");

                      handleViewInfo();
                    }}
                  >
                    <Info className="mr-2 h-4 w-4" />
                    <span>
                      {channel.is_group ? "Group Info" : "Contact Info"}
                    </span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleClearChat}>
                    <MessageCircleOff className="mr-2 h-4 w-4" />
                    <span>Clear Chat</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleDeleteChat}
                    className="text-destructive focus:text-destructive"
                  >
                    <UserX className="mr-2 h-4 w-4" />
                    <span>
                      {channel.is_group ? "Leave Group" : "Delete Chat"}
                    </span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default ChatWindowHeader;
