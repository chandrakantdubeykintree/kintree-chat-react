// frontend/src/components/chats/ChatWindow.jsx
import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import useChatStore from "./useChatStore";
import {
  fetchMessages, // Make sure this is correctly imported
  emitSendMessage,
  emitEditMessage,
  emitDeleteMessage,
  emitMarkMessageRead,
  emitMarkAllRead,
  // emitClearChat, // These might be called from Header
  // emitDeleteChannel, // These might be called from Header
} from "./socketService";
import MessageBubble from "./MessageBubble";
import MessageInput from "./MessageInput";
import ChatWindowHeader from "./ChatWindowHeader";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { uploadAttachment } from "./apiService";
import useAuthStore from "./useAuthStore";
import { isSameDay, format, isYesterday, isToday } from "date-fns";
import DateSeparator from "./date-separator";

const ChatWindow = ({
  channelId,
  onBack,
  onViewContactInfo,
  onViewMessageInfo,
}) => {
  // --- Store Selection (Optimized) ---
  const channel = useChatStore(
    useCallback(
      (state) => state.channels.find((c) => c.id === channelId),
      [channelId]
    )
  );
  const channelMessagesData = useChatStore(
    useCallback(
      (state) => state.messages[channelId] || defaultChannelMessageState,
      [channelId]
    )
  );
  const selectedMessagesMap = useChatStore((state) => state.selectedMessages);
  const isSelecting = useChatStore((state) => state.isSelecting);
  const toggleMessageSelection = useChatStore(
    (state) => state.toggleMessageSelection
  );
  const resetMessagesForChannel = useChatStore(
    (state) => state.resetMessagesForChannel
  ); // Get reset action

  // Destructure derived message data
  const { messages, currentPage, lastPage, loading, error } =
    channelMessagesData;

  // Default state structure memoized
  const defaultChannelMessageState = useMemo(
    () => ({
      messages: [],
      currentPage: 0,
      lastPage: 1,
      total: 0,
      loading: false,
      error: null,
    }),
    []
  );

  // Derive selected messages for the current channel
  const selectedMessages = useMemo(
    () => selectedMessagesMap[channelId] || new Set(),
    [selectedMessagesMap, channelId]
  );
  // --- End Store Selection ---

  const [editingMessage, setEditingMessage] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const scrollAreaRef = useRef(null);
  const messagesEndRef = useRef(null);
  const topMessageObserverTargetRef = useRef(null); // Renamed for clarity
  const [initialLoadComplete, setInitialLoadComplete] = useState(false); // Track initial load

  // --- Effects ---

  // Fetch initial messages or reset on channel change
  useEffect(() => {
    setEditingMessage(null); // Cancel editing when channel changes
    setInitialLoadComplete(false); // Reset initial load flag

    if (channelId) {
      // Check if messages are already loaded or if we need to fetch page 1
      const currentData = useChatStore.getState().messages[channelId];
      // Reset messages explicitly if channel switches, prevents seeing old messages briefly
      if (channelId !== useChatStore.getState().activeChannelId) {
        resetMessagesForChannel(channelId); // Use the reset action
      }

      if (!currentData || currentData.currentPage === 0) {
        // Fetch only if no pages loaded yet
        console.log(
          `ChatWindow Effect: Fetching initial messages (page 1) for channel ${channelId}`
        );
        fetchMessages(channelId, 1) // Fetch page 1
          .then(() => setInitialLoadComplete(true))
          .catch(() => setInitialLoadComplete(true)); // Mark complete even on error
      } else {
        // Already have some messages, mark initial load as complete
        setInitialLoadComplete(true);
        console.log(
          `ChatWindow Effect: Messages already present for channel ${channelId} (current page: ${currentData.currentPage})`
        );
      }
    }

    // Cleanup function to potentially reset state or cancel fetches if needed
    return () => {
      // Maybe cancel ongoing fetches if channelId changes rapidly? (More complex)
      console.log(`ChatWindow Effect Cleanup for channel ${channelId}`);
    };
  }, [channelId, resetMessagesForChannel]); // Depend only on channelId and the reset action

  // Scroll to bottom logic
  useEffect(() => {
    // Only scroll after the initial load is complete and not in selection mode
    if (!initialLoadComplete || isSelecting || !messagesEndRef.current) {
      return;
    }

    const scrollViewport = scrollAreaRef.current?.children[1]; // Access the viewport element
    if (scrollViewport && messages.length > 0) {
      // Scroll immediately to bottom only on the very first load (currentPage === 1)
      // or if user was already near the bottom before new messages arrived.
      const isFirstPage = currentPage === 1;
      const isNearBottom =
        scrollViewport.scrollHeight -
          scrollViewport.scrollTop -
          scrollViewport.clientHeight <
        300; // Adjust threshold as needed

      if (isFirstPage || isNearBottom) {
        // Use 'auto' for instant scroll on first load, 'smooth' otherwise might be too slow
        // Consider 'instant' behavior from 'scroll-behavior-polyfill' if needed
        messagesEndRef.current.scrollIntoView({
          behavior: "auto",
          block: "end",
        });
        console.log(
          "Scrolling to bottom:",
          isFirstPage ? "Initial" : "Near bottom"
        );
      }
    }
    // Depend on initialLoadComplete flag, message count, current page, and selection state
  }, [
    messages.length,
    channelId,
    currentPage,
    initialLoadComplete,
    isSelecting,
  ]);

  // Intersection Observer for infinite scroll (Corrected)
  const observer = useRef();

  // Memoized callback to load more messages
  const loadMoreMessages = useCallback(() => {
    // Read state directly inside the callback to get the latest values
    const state = useChatStore.getState();
    const currentChannelData = state.messages[channelId];

    // Check conditions using the latest state
    if (
      !channelId ||
      !currentChannelData ||
      currentChannelData.loading ||
      currentChannelData.currentPage >= currentChannelData.lastPage
    ) {
      console.log("Load More: Conditions not met", {
        loading: currentChannelData?.loading,
        currentPage: currentChannelData?.currentPage,
        lastPage: currentChannelData?.lastPage,
        channelId,
      });
      return;
    }

    const nextPage = currentChannelData.currentPage + 1;
    console.log(
      `Load More: Requesting page ${nextPage} for channel ${channelId}`
    );
    fetchMessages(channelId, nextPage); // fetchMessages now returns a promise, but we don't need to await it here
  }, [channelId]); // Dependency: channelId (fetchMessages uses channelId)

  // Effect to setup the Intersection Observer
  useEffect(() => {
    const scrollViewport = scrollAreaRef.current?.children[1]; // Viewport is the root
    const targetElement = topMessageObserverTargetRef.current; // Element to observe

    // Only setup if viewport, target exist, and there are more pages to load
    if (
      !scrollViewport ||
      !targetElement ||
      loading ||
      currentPage >= lastPage
    ) {
      // If observer exists, disconnect it if conditions are no longer met
      if (observer.current) {
        observer.current.disconnect();
        console.log("Observer disconnected (conditions not met).");
      }
      return;
    }

    console.log("Setting up Intersection Observer...");

    const intersectionCallback = (entries) => {
      const entry = entries[0];
      if (entry.isIntersecting && !loading && currentPage < lastPage) {
        console.log(
          "Intersection Observer: Target is intersecting, calling loadMoreMessages."
        );
        loadMoreMessages();
      } else {
        // Optional: Log why it's not loading
        if (entry.isIntersecting) {
          console.log(
            "Intersection Observer: Target intersecting, but not loading.",
            { loading, currentPage, lastPage }
          );
        }
      }
    };

    // Create observer if it doesn't exist
    if (!observer.current) {
      observer.current = new IntersectionObserver(intersectionCallback, {
        root: scrollViewport, // Observe within the scrollable viewport
        threshold: 0.1, // Trigger when 10% visible
        // rootMargin: '100px 0px 0px 0px' // Optional: Load slightly before it's visible
      });
    }

    // Observe the target
    observer.current.observe(targetElement);
    console.log("Observer is now observing the target.");

    // Cleanup function
    return () => {
      if (observer.current) {
        observer.current.disconnect();
        console.log("Observer disconnected on cleanup.");
        // observer.current = null; // Optionally nullify the ref
      }
    };
    // Dependencies: Recalculate when these change, especially after loading finishes or page numbers update
  }, [loadMoreMessages, loading, currentPage, lastPage, channelId]); // Added channelId

  // Mark messages as read (logic seems okay, depends on channel data)
  useEffect(() => {
    if (channelId && channel && channel.unread_message_count > 0) {
      // Debounce or delay slightly to avoid marking read instantly on open
      const timer = setTimeout(() => {
        console.log(`Marking channel ${channelId} as read`);
        emitMarkAllRead(channelId).catch((err) =>
          console.warn("Failed to mark all messages read:", err?.message || err)
        );
      }, 1000); // 1 second delay
      return () => clearTimeout(timer);
    }
  }, [channelId, channel]); // Depend on channelId and the channel object itself

  // --- Event Handlers (mostly unchanged) ---
  const handleSendMessage = async (chId, messageText, attachmentId = null) => {
    if ((!messageText || !messageText.trim()) && !attachmentId) {
      console.warn("Attempted to send empty message without attachment.");
      return;
    }
    if (isSending) return;
    setIsSending(true);
    const action = editingMessage ? "edit" : "send";
    const toastId = toast.loading(
      editingMessage ? "Updating message..." : "Sending message..."
    );

    try {
      if (editingMessage) {
        await emitEditMessage(chId, editingMessage.id, messageText || ""); // Allow sending empty string to delete text
        toast.success("Message updated", { id: toastId });
        setEditingMessage(null); // Clear editing state on success
      } else {
        await emitSendMessage(chId, messageText, attachmentId);
        // Assuming 'newMessage' event updates the UI, no success toast needed here unless desired
        toast.dismiss(toastId); // Dismiss loading toast on success
      }
      // Clear input field after successful send/edit
      // The MessageInput component will clear itself if !editingMessage
    } catch (err) {
      console.error(`Failed to ${action} message:`, err);
      toast.error(`Error: ${err?.message || `Could not ${action} message`}`, {
        id: toastId,
      });
    } finally {
      setIsSending(false);
      // Let MessageInput clear itself based on editingMessage state
    }
  };

  const handleEditAction = (messageToEdit) => {
    setEditingMessage(messageToEdit);
  };

  const handleCancelEdit = () => {
    setEditingMessage(null);
  };

  const handleDeleteMessage = async (messageId) => {
    if (!channelId) return;
    // Consider using a confirmation dialog component instead of window.confirm
    if (window.confirm("Are you sure you want to delete this message?")) {
      // Optionally show loading state
      const toastId = toast.loading("Deleting message...");
      try {
        await emitDeleteMessage(channelId, messageId);
        toast.success("Message deleted", { id: toastId });
        // The 'messageDeleted' listener should update the UI
      } catch (err) {
        console.error("Failed to delete message:", err);
        toast.error(`Delete failed: ${err?.message || "Unknown error"}`, {
          id: toastId,
        });
      }
    }
  };

  const handleSelectMessage = (messageId) => {
    if (!channelId) return;
    toggleMessageSelection(channelId, messageId);
  };

  // Attachment upload logic seems okay
  const handleAttachmentUpload = async (file) => {
    if (!channelId || isSending) return;
    setIsSending(true); // Use the main sending flag
    const toastId = toast.loading("Uploading attachment...");
    try {
      const token = useAuthStore.getState().token;
      if (!token) throw new Error("Authentication token not found.");
      const response = await uploadAttachment(token, file);
      if (response.success && response.data?.id) {
        const attachmentId = response.data.id;
        // Attachment uploaded, now send the message with attachment ID
        // Don't show success for upload, wait for message send success
        toast.dismiss(toastId); // Dismiss upload toast
        await handleSendMessage(channelId, "", attachmentId); // Send message with attachment
      } else {
        throw new Error(
          response.message || "Upload processing failed on server"
        );
      }
    } catch (error) {
      console.error("Attachment Upload/Send failed:", error);
      toast.error(`Attachment Error: ${error.message || "Upload failed"}`, {
        id: toastId, // Update the same toast on error
      });
      setIsSending(false); // Reset sending state on upload error
    }
    // No finally here, handleSendMessage will set isSending to false
  };

  // --- Message Rendering with Separators (Memoized) ---
  const messagesWithSeparators = useMemo(() => {
    const result = [];
    let lastDate = null;

    // Iterate backwards if prepending, but messages array is already sorted ASC
    messages.forEach((msg, index) => {
      if (!msg || !msg.created_at) {
        console.warn("Skipping message with invalid data:", msg);
        return; // Skip invalid messages
      }
      const currentDate = new Date(msg.created_at);
      if (!lastDate || !isSameDay(currentDate, lastDate)) {
        let dateString;
        if (isToday(currentDate)) dateString = "Today";
        else if (isYesterday(currentDate)) dateString = "Yesterday";
        else dateString = format(currentDate, "MMMM d, yyyy");

        result.push(
          <DateSeparator key={`sep-${msg.id || index}`} date={dateString} />
        );
        lastDate = currentDate;
      }

      result.push(
        <MessageBubble
          key={msg.id || `temp-${index}`} // Use temp key if ID is missing initially
          message={msg}
          isSelected={selectedMessages.has(msg.id)}
          onSelect={handleSelectMessage}
          onEditAction={handleEditAction}
          onDelete={handleDeleteMessage}
          onViewMessageInfo={onViewMessageInfo}
        />
      );
    });
    return result;
  }, [
    messages,
    selectedMessages,
    handleSelectMessage,
    handleEditAction,
    handleDeleteMessage,
    onViewMessageInfo,
  ]); // Ensure handlers are stable or included if needed

  // --- Rendering ---

  if (!channelId) {
    // Placeholder when no chat is selected
    return (
      <div className="flex flex-col h-full items-center justify-center text-muted-foreground bg-muted/20">
        <p>Select a chat to start messaging</p>
      </div>
    );
  }

  // Initial loading state for the channel
  if (!initialLoadComplete && loading && messages.length === 0) {
    return (
      <div className="flex flex-col h-full items-center justify-center bg-muted/20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p>Loading chat...</p>
      </div>
    );
  }
  // Error state for initial load
  if (error && messages.length === 0) {
    return (
      <div className="flex flex-col h-full items-center justify-center text-center p-4 bg-muted/20">
        <p className="text-destructive font-semibold mb-2">
          Error Loading Chat
        </p>
        <p className="text-muted-foreground text-sm mb-4">{error}</p>
        <Button onClick={() => fetchMessages(channelId, 1)}>Retry</Button>
      </div>
    );
  }

  // Channel selected, rendering chat interface
  return (
    <div className="flex flex-col h-full bg-muted/20 border overflow-hidden">
      {/* Header (Row 1 - Auto Height) */}
      <div className="flex-shrink-0 border-b">
        {channel ? (
          <ChatWindowHeader
            channel={channel}
            onBack={onBack}
            onViewContactInfo={onViewContactInfo}
          />
        ) : (
          <div className="flex items-center p-3 border-b h-[69px] bg-background">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        )}
      </div>

      {/* Message Scroll Area (Row 2 - 1fr Height, handles overflow) */}
      <ScrollArea
        ref={scrollAreaRef}
        className="flex-1 min-h-0 overflow-y-auto no_scrollbar"
      >
        {/* Observer Target */}
        {currentPage < lastPage && (
          <div
            ref={topMessageObserverTargetRef}
            className="h-10 flex justify-center items-center"
          >
            {loading && (
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            )}
          </div>
        )}

        {/* Messages */}
        <div className="space-y-1 pb-4">{messagesWithSeparators}</div>

        {/* Empty State */}
        {initialLoadComplete && messages.length === 0 && !error && !loading && (
          <div className="flex justify-center items-center h-full text-muted-foreground">
            <p>No messages yet. Start the conversation!</p>
          </div>
        )}

        {/* Scroll Anchor */}
        <div ref={messagesEndRef} className="h-1" />
      </ScrollArea>

      {/* Message Input */}
      <div className="flex-shrink-0 border-t">
        <MessageInput
          channelId={channelId}
          onSendMessage={handleSendMessage}
          editingMessage={editingMessage}
          onCancelEdit={handleCancelEdit}
          onAttachmentSelected={handleAttachmentUpload}
          isSending={isSending}
        />
      </div>
    </div>
  );
};

export default ChatWindow;
