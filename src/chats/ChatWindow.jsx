// src/components/chats/ChatWindow.jsx
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import useChatStore from "./useChatStore";
import {
  fetchMessages, // Make sure this is correctly imported
  emitSendMessage,
  emitEditMessage,
  emitDeleteMessage,
  emitMarkAllRead,
  emitMarkAllDelivered,
  getSocket,
  // emitClearChat, // These might be called from Header
  // emitDeleteChannel, // These might be called from Header
} from "./socketService";
import MessageBubble from "./MessageBubble";
import MessageInput from "./MessageInput";
import ChatWindowHeader from "./ChatWindowHeader";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { uploadAttachment } from "./apiService";
import useAuthStore from "./useAuthStore";
import { isSameDay, format, isYesterday, isToday } from "date-fns";
import DateSeparator from "./date-separator";
import { useUploadAttachment } from "@/hooks/useAttachments";
import AttachmentInputPreview from "./AttachmentInputPreview";

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
  const [attachmentForPreview, setAttachmentForPreview] = useState(null);
  const scrollAreaRef = useRef(null);
  const messagesEndRef = useRef(null);
  const topMessageObserverTargetRef = useRef(null); // Renamed for clarity
  const [initialLoadComplete, setInitialLoadComplete] = useState(false); // Track initial load
  const originalFileRef = useRef(null);

  const {
    mutate: triggerUpload, // Function to call to start upload
    isPending: isUploading, // Derived loading state from hook
    data: uploadMutationData, // Raw success data from the mutation's onSuccess
    error: uploadError, // Error object from the mutation
    reset: resetUploadMutation, // Function to reset the mutation state
  } = useUploadAttachment();

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
        fetchMessages(channelId, 1) // Fetch page 1
          .then(() => setInitialLoadComplete(true))
          .catch(() => setInitialLoadComplete(true)); // Mark complete even on error
      } else {
        // Already have some messages, mark initial load as complete
        setInitialLoadComplete(true);
      }
    }

    // Cleanup function to potentially reset state or cancel fetches if needed
    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, [channelId, resetMessagesForChannel, resetUploadMutation]); // Depend only on channelId and the reset action

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

    if (
      !channelId ||
      !currentChannelData ||
      currentChannelData.loading ||
      currentChannelData.currentPage >= currentChannelData.lastPage
    ) {
      return; // Exit if already loading or no more pages
    }

    const nextPage = currentChannelData.currentPage + 1;

    fetchMessages(channelId, nextPage)
      .then(() => {
        console.log(`Successfully loaded page ${nextPage}`);
      })
      .catch((error) => {
        console.error(`Error loading page ${nextPage}:`, error);
      });
  }, [channelId]);

  // Effect to process successful upload data
  useEffect(() => {
    // Check if mutation succeeded and returned expected data structure
    // Adjust 'uploadMutationData.data?.[0]?.id' based on your actual hook/API response
    if (
      uploadMutationData?.success &&
      uploadMutationData?.data?.[0]?.id &&
      originalFileRef.current
    ) {
      console.log(
        "[ChatWindow] Upload success, setting attachment preview:",
        uploadMutationData.data[0]
      );
      setAttachmentForPreview({
        file: originalFileRef.current, // Keep original file info if needed for preview
        data: uploadMutationData.data[0], // Store server response (containing ID, URL, etc.)
      });
      originalFileRef.current = null; // Clear the ref after processing
      // Don't resetUploadMutation here, wait until message is sent or preview cancelled
    } else if (uploadMutationData && !uploadMutationData.success) {
      // Handle cases where mutation finishes but API reports failure
      console.warn(
        "[ChatWindow] Upload mutation finished but API reported failure:",
        uploadMutationData.message
      );
      toast.error("Upload Failed", {
        description:
          uploadMutationData.message || "Server couldn't process the file.",
      });
      originalFileRef.current = null;
      resetUploadMutation(); // Reset on failure
      setAttachmentForPreview(null);
    }
  }, [uploadMutationData]); // Depend only on the mutation data

  // Effect to handle upload errors
  useEffect(() => {
    if (uploadError) {
      console.error("[ChatWindow] Upload mutation hook error:", uploadError);
      toast.error("Upload Error", {
        description: uploadError.message || "Could not upload attachment.",
      });
      setAttachmentForPreview(null);
      originalFileRef.current = null;
      resetUploadMutation(); // Reset on error
    }
  }, [uploadError, resetUploadMutation]);

  // Handler triggered by MessageInput when a file is selected
  const handleFileSelected = (file) => {
    // Renamed for clarity
    if (file && !isUploading) {
      resetUploadMutation();
      setAttachmentForPreview(null);
      originalFileRef.current = file;
      const formData = new FormData();
      formData.append("files[]", file);
      triggerUpload(formData); // Call the hook's mutate function
    }
  };

  const clearPreviewAndResetUpload = () => {
    setAttachmentForPreview(null);
    resetUploadMutation();
    originalFileRef.current = null;
    // Optionally delete from server if needed
    // const attachmentIdToDelete = uploadMutationData?.data?.[0]?.id; // Get ID from previous successful upload
    // if (attachmentIdToDelete) { /* call delete mutation */ }
  };

  // Effect to setup the Intersection Observer
  useEffect(() => {
    // Wait for initial load AND ensure there are more pages to load
    if (
      !initialLoadComplete ||
      currentPage >= lastPage ||
      !topMessageObserverTargetRef.current
    ) {
      // If observer exists, disconnect it if conditions aren't met
      if (observer.current) {
        observer.current.disconnect();
      }
      return; // Don't setup if initial load not done or no more pages
    }

    const targetElement = topMessageObserverTargetRef.current;

    // Define the callback *inside* the effect to capture correct state
    const intersectionCallback = (entries) => {
      const entry = entries[0];
      // Get the LATEST loading state directly inside the callback
      const isLoading = useChatStore.getState().messages[channelId]?.loading;

      // Check intersection AND ensure we are not already loading
      if (entry.isIntersecting && !isLoading) {
        loadMoreMessages();
      } else {
        console.log(
          "[Observer Callback] Target not intersecting or already loading."
        );
      }
    };

    // Disconnect previous observer if it exists
    if (observer.current) {
      observer.current.disconnect();
    }

    observer.current = new IntersectionObserver(intersectionCallback, {
      root: scrollAreaRef.current?.children[1], // Observe within the scroll viewport
      rootMargin: "100px 0px 0px 0px", // Trigger when target is 100px from top edge of viewport
      threshold: 0.1, // Trigger when 10% is visible (can adjust)
    });

    // Start observing target
    observer.current.observe(targetElement);

    // Return cleanup function to disconnect observer
    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
    // Rerun when initial load completes, or pagination changes, or target ref available
  }, [initialLoadComplete, currentPage, lastPage, channelId, loadMoreMessages]);

  useEffect(() => {
    if (channelId && channel && initialLoadComplete) {
      const timer = setTimeout(() => {
        // Add connection check before emitting
        if (getSocket()?.connected) {
          // Check connection status

          emitMarkAllDelivered(channelId)
            .then(() =>
              console.log(
                ` -> emitMarkAllDelivered for ${channelId} successful.`
              )
            )
            .catch((err) =>
              console.warn(
                ` -> Failed to mark channel ${channelId} delivered:`,
                err?.message || err
              )
            );
        } else {
          console.warn(
            ` -> Skipping emitMarkAllDelivered: Socket not connected.`
          );
        }

        if (channel.unread_message_count > 0) {
          if (getSocket()?.connected) {
            // Check connection status

            emitMarkAllRead(channelId)
              .then(() =>
                console.log(` -> emitMarkAllRead for ${channelId} successful.`)
              )
              .catch((err) =>
                console.warn(
                  ` -> Failed to mark channel ${channelId} read:`,
                  err?.message || err
                )
              );
          } else {
            console.warn(` -> Skipping emitMarkAllRead: Socket not connected.`);
          }
        } else {
          console.log(
            ` -> Skipping emitMarkAllRead for channel ${channelId} (no unread count)`
          );
        }
      }, 500);
      return () => clearTimeout(timer);
    } else {
      console.log(
        `[ChatWindow Effect MarkRead/Deliv] Skipping, channelId: ${channelId}, channel: ${!!channel}, initialLoadComplete: ${initialLoadComplete}`
      );
    }
    // Add initialLoadComplete to dependencies
  }, [channelId, channel, initialLoadComplete]);

  // Preserve scroll position when loading older messages
  useEffect(() => {
    if (loading) {
      // Store the scroll height and position before loading new messages
      const scrollContainer = scrollAreaRef.current;
      if (scrollContainer) {
        const prevScrollHeight = scrollContainer.scrollHeight;
        const prevScrollTop = scrollContainer.scrollTop;

        // After the DOM updates with new messages
        const handleUpdate = () => {
          if (scrollContainer) {
            // Calculate how much the scroll height has increased
            const newScrollHeight = scrollContainer.scrollHeight;
            const heightDiff = newScrollHeight - prevScrollHeight;

            // Adjust scroll position to keep the same content in view
            if (heightDiff > 0 && currentPage > 1) {
              scrollContainer.scrollTop = prevScrollTop + heightDiff;
            }
          }
        };

        // Use setTimeout to run after DOM update
        const timerId = setTimeout(handleUpdate, 50);
        return () => clearTimeout(timerId);
      }
    }
  }, [loading, messages.length, currentPage]);

  // --- Event Handlers (mostly unchanged) ---
  const handleSendMessage = async (chId, messageText) => {
    // Remove attachmentId from signature
    const attachmentId = attachmentForPreview?.data?.id; // Get ID from preview state

    // Check if there's text OR an attachment ID
    if (
      (!messageText || !messageText.trim()) &&
      !attachmentId &&
      !editingMessage
    ) {
      console.warn("Attempted to send empty message without attachment.");
      return;
    }
    if (isSending || isUploading) return; // Prevent sending if uploading or already sending

    setIsSending(true); // Indicate socket message sending is in progress
    const action = editingMessage ? "edit" : "send";
    const toastId = toast.loading(
      editingMessage ? "Updating message..." : "Sending message..."
    );

    try {
      if (editingMessage) {
        // Attachments generally aren't edited, only text
        await emitEditMessage(chId, editingMessage.id, messageText || "");
        toast.success("Message updated", { id: toastId });
        setEditingMessage(null);
      } else {
        // Send message text and/or attachment ID
        await emitSendMessage(chId, messageText, attachmentId); // Pass attachmentId here
        toast.dismiss(toastId);

        // --- Clear attachment state ONLY on successful send ---
        if (attachmentId) {
          setAttachmentForPreview(null);
          resetUploadMutation(); // Reset hook fully
          originalFileRef.current = null;
        }
      }
      // MessageInput will clear text if not editing
    } catch (err) {
      console.error(`Failed to ${action} message:`, err);
      toast.error(`Error: ${err?.message || `Could not ${action} message`}`, {
        id: toastId,
      });
      // Do NOT clear attachment preview on send error, allow retry
    } finally {
      setIsSending(false);
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
    <div className="flex flex-col h-full">
      {/* Header (Row 1 - Fixed Height) */}
      <div className="flex-shrink-0 sticky top-0 z-10 bg-background border-b">
        {channel ? (
          <ChatWindowHeader
            channel={channel}
            onBack={onBack}
            onViewContactInfo={onViewContactInfo}
          />
        ) : (
          <div className="flex items-center p-3 h-[69px]">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        )}
      </div>

      {/* Message Scroll Area (Row 2 - Flexible Height) */}
      <div className="flex-1 overflow-y-auto" ref={scrollAreaRef}>
        {/* Observer Target at the top - this is what gets watched for scrolling up */}
        {currentPage < lastPage && (
          <div
            ref={topMessageObserverTargetRef}
            className="h-10 flex justify-center items-center sticky top-0"
          >
            {loading && (
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            )}
            {!loading && (
              <div className="text-xs text-muted-foreground">
                Scroll up to load more
              </div>
            )}
          </div>
        )}

        {/* Messages */}
        <div className="space-y-1 p-4">{messagesWithSeparators}</div>

        {/* Empty State */}
        {initialLoadComplete && messages.length === 0 && !error && !loading && (
          <div className="flex justify-center items-center text-muted-foreground py-10">
            <p>No messages yet. Start the conversation!</p>
          </div>
        )}

        {/* Scroll Anchor */}
        <div ref={messagesEndRef} className="h-1" />
      </div>

      {/* Message Input (Row 3 - Fixed Height) */}
      {/* Message Input Area */}
      <div className="flex-shrink-0 sticky bottom-0 bg-background border-t">
        {/* Conditionally render Attachment Preview */}
        {attachmentForPreview && !isUploading && (
          <AttachmentInputPreview
            attachmentPreview={attachmentForPreview}
            onRemove={clearPreviewAndResetUpload}
          />
        )}

        {/* Message Input Component */}
        <MessageInput
          channelId={channelId}
          onSendMessage={handleSendMessage} // Connects to the handler above
          editingMessage={editingMessage}
          onCancelEdit={handleCancelEdit}
          // File selection triggers upload in parent
          onAttachmentSelected={handleFileSelected} // Renamed prop
          // Pass down upload/preview state
          isUploading={isUploading}
          // Pass function to clear preview
          clearUploadPreview={clearPreviewAndResetUpload}
          // Pass message sending state
          isSending={isSending}
        />
      </div>
    </div>
  );
};

export default ChatWindow;
