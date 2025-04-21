// src/chats/MessageBubble.jsx
import React from "react";
import { format } from "date-fns";
import {
  Check,
  CheckCheck,
  Clock,
  Edit3,
  Trash2,
  MoreVertical,
  Info,
} from "lucide-react";
import useAuthStore from "./useAuthStore";
import useChatStore from "./useChatStore";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import AttachmentPreview from "./AttachmentPreview"; // Import Attachment Preview component

const MessageBubble = ({
  message,
  isSelected,
  onSelect,
  onEditAction,
  onDelete,
  onViewMessageInfo,
}) => {
  // Added onEditAction
  const currentUser = useAuthStore((state) => state.user);

  const isSelecting = useChatStore((state) => state.isSelecting);
  const isSender = message.created_by?.id === currentUser?.id;

  const handleInfoClick = (e) => {
    e.stopPropagation();
    if (onViewMessageInfo) {
      onViewMessageInfo(message);
    }
  };

  const getStatusIcon = () => {
    if (!isSender) return null;
    if (message.read_at)
      return <CheckCheck size={16} className="text-blue-500" />;
    if (message.delivered_at)
      return <CheckCheck size={16} className="text-muted-foreground" />;
    // Check if message has an ID - implies it's sent (remove if using pending state)
    if (message.id)
      return <Check size={16} className="text-muted-foreground" />;
    // Optional: Pending state if you implement optimistic UI with temp IDs
    // return <Clock size={16} className="text-muted-foreground" />;
    return null;
  };

  // Combine long press and click for selection
  const handleInteraction = (e) => {
    // Only handle clicks for selection when already in selection mode
    if (isSelecting && e.type === "click") {
      // e.preventDefault(); // Not usually needed for click
      onSelect(message.id);
    }
    // Allow context menu on desktop if NOT selecting
    else if (!isSelecting && e.type === "contextmenu") {
      // Prevent default context menu ONLY if we are NOT selecting
      // Or handle custom context menu if needed
      // e.preventDefault(); // Optional: prevent default right-click menu
    }
  };

  // Mobile Long Press specific handler
  const handleTouchStart = (e) => {
    // If already selecting, treat touchstart like a click for toggling
    if (isSelecting) {
      // e.preventDefault(); // Usually not needed here either
      onSelect(message.id);
      return; // Don't proceed with long-press logic
    }

    // --- Logic for initiating long press selection ---
    const touchStartTime = Date.now();
    let touchMoved = false;
    let timerId = null; // Use null initially

    // Use a target reference that won't change if component re-renders slightly
    const targetElement = e.currentTarget;

    const handleTouchMove = () => {
      touchMoved = true;
      // If the finger moves, cancel the long press timer
      if (timerId) {
        clearTimeout(timerId);
        timerId = null;
      }
      // Clean up move/end listeners immediately if move detected
      cleanupTouchListeners();
    };

    const handleTouchEnd = (ev) => {
      // Clear timer if it's still active (i.e., long press didn't fire)
      if (timerId) {
        clearTimeout(timerId);
        timerId = null;
      }
      cleanupTouchListeners();
      // Note: Short tap logic could go here if needed, but we handle selection via `handleInteraction` onClick now
    };

    const cleanupTouchListeners = () => {
      // Remove listeners from the specific element or window
      targetElement.removeEventListener("touchmove", handleTouchMove);
      targetElement.removeEventListener("touchend", handleTouchEnd);
      targetElement.removeEventListener("touchcancel", handleTouchEnd); // Also cleanup on cancel
    };

    // Attach listeners
    targetElement.addEventListener("touchmove", handleTouchMove, {
      passive: true,
    }); // Use passive listener for move
    targetElement.addEventListener("touchend", handleTouchEnd);
    targetElement.addEventListener("touchcancel", handleTouchEnd);

    // Set timer for long press action
    timerId = setTimeout(() => {
      // Check if touch hasn't moved by the time timer fires
      if (!touchMoved) {
        window.navigator.vibrate?.(50); // Haptic feedback
        // Trigger the long press action (selection)
        handleLongPressAction();
        // Important: Cleanup listeners AFTER long press detected & action taken
        cleanupTouchListeners();
      }
      timerId = null; // Clear timerId after execution
    }, 500); // 500ms for long press
  };

  const handleLongPress = (e) => {
    e.preventDefault();
    onSelect(message.id); // Trigger selection on long press
  };

  const handleEditClick = (e) => {
    e.stopPropagation(); // Prevent bubble click/selection
    onEditAction(message); // Call the edit handler passed from ChatWindow
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    onDelete(message.id);
  };

  const handleLongPressAction = () => {
    // Directly call the selection logic passed via props
    onSelect(message.id);
    // No e.preventDefault() needed here, as the goal is just state change
  };

  return (
    <div
      className={cn(
        "flex group relative",
        isSender ? "justify-end" : "justify-start",
        // Add more padding if there's an attachment
        message.attachments && message.attachments.length > 0 ? "mb-2" : "mb-1"
      )}
      onClick={handleInteraction}
      onContextMenu={handleInteraction} // Use same handler for desktop right-click
      onTouchStart={handleTouchStart} // Use specific touch handler for mobile long press
    >
      {/* Selection Overlay - visible only when selecting */}
      {isSelecting && (
        <div
          className={cn(
            "absolute inset-0 z-0 rounded-lg",
            isSelected
              ? isSender
                ? "bg-blue-500/30"
                : "bg-gray-500/30"
              : "bg-transparent hover:bg-gray-500/10",
            "cursor-pointer"
          )}
        />
      )}

      {/* Message Content Container */}
      <div
        className={cn(
          "relative z-10 py-2 px-3 rounded-lg max-w-[75%] break-words shadow-sm", // Added shadow
          isSender
            ? "bg-primary text-primary-foreground"
            : "bg-card text-card-foreground border", // Use card for received
          // Add margin for the dropdown trigger if it's the sender
          isSender && !isSelecting ? "mr-1" : "" // Space for the dropdown trigger
        )}
      >
        {/* Render sender name in groups? Maybe later */}

        {/* Render Attachments FIRST if they exist */}
        {message.attachments && message.attachments.length > 0 && (
          <div className={message.message ? "mb-1" : ""}>
            {" "}
            {/* Margin below attachment if text follows */}
            {message.attachments.map((att, index) => (
              <AttachmentPreview key={index} attachment={att} />
            ))}
          </div>
        )}

        {/* Render Message Text if it exists */}
        {message.message && (
          <p className="text-sm whitespace-pre-wrap">{message.message}</p>
        )}

        {/* Timestamp and Status - Aligned bottom right */}
        <div className="flex items-center justify-end mt-1 space-x-1 float-right clear-both">
          {" "}
          {/* Float ensures it goes below content */}
          <span className="text-xs opacity-70 select-none">
            {" "}
            {/* Prevent selecting time */}
            {format(new Date(message.created_at), "p")}
          </span>
          {getStatusIcon()}
        </div>
      </div>

      {/* Action Menu (Show on hover for sender IF NOT selecting) */}
      {isSender && !isSelecting && (
        <div
          className={cn(
            "flex-shrink-0 self-center ml-1 z-20", // Spacing and z-index
            // Control VISIBILITY/OPACITY with group-hover directly on the trigger's container/button
            "opacity-0 group-hover:opacity-100 focus-within:opacity-100", // Appear on hover/focus
            "transition-opacity duration-150"
          )}
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-full flex items-center justify-center"
                // Optional: stop propagation if clicks on button trigger bubble selection
                onClick={(e) => e.stopPropagation()}
                onContextMenu={(e) => e.stopPropagation()} // Prevent context menu on button
                onTouchStart={(e) => e.stopPropagation()} // Prevent long press on button
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            {/* Content portals out and positions itself - NOT clipped */}
            <DropdownMenuContent
              align="end"
              side="left"
              className="w-40"
              // Optional: Prevent clicks inside menu from affecting bubble
              onClick={(e) => e.stopPropagation()}
              onContextMenu={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
            >
              <DropdownMenuItem
                onSelect={(e) => e.preventDefault()}
                onClick={handleInfoClick}
              >
                {" "}
                {/* onSelect stops default close */}
                <Info className="mr-2 h-4 w-4" />
                <span>Info</span>
              </DropdownMenuItem>
              {message.message && (
                <DropdownMenuItem
                  onSelect={(e) => e.preventDefault()}
                  onClick={handleEditClick}
                >
                  <Edit3 className="mr-2 h-4 w-4" />
                  <span>Edit</span>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onSelect={(e) => e.preventDefault()}
                onClick={handleDeleteClick}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                <span>Delete</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
};

export default MessageBubble;
