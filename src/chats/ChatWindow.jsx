// frontend/src/components/ChatWindow.jsx
import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react"; // Added useMemo
// Remove shallow import - we won't need it with direct selection
// import { shallow } from 'zustand/shallow';
import useChatStore from "./useChatStore";
import {
  fetchMessages,
  emitSendMessage,
  emitEditMessage,
  emitDeleteMessage,
  emitMarkMessageRead,
  emitMarkAllRead,
  emitClearChat,
  emitDeleteChannel,
} from "./socketService"; // Ensure all emitters are imported if needed elsewhere
import MessageBubble from "./MessageBubble";
import MessageInput from "./MessageInput";
import ChatWindowHeader from "./ChatWindowHeader";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react"; // Spinner
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { uploadAttachment } from "./apiService"; // Import upload service
import useAuthStore from "./useAuthStore"; // Need this for uploadAttachment
import { isSameDay, format, isYesterday, isToday } from "date-fns";
import DateSeparator from "./date-separator"; // Import the new component
import { SOCKET_EVENTS } from "./chatConstants"; // Use constants
import { getSocket } from "./socketService"; // Only need getSocket here

const ChatWindow = ({
  channelId,
  onBack,
  onViewContactInfo,
  onViewMessageInfo,
}) => {
  // --- Refactored Store Selection ---
  // Select top-level slices and functions directly. Zustand optimizes this.
  const channels = useChatStore((state) => state.channels);
  const messagesByChannel = useChatStore((state) => state.messages);
  const selectedMessagesMap = useChatStore((state) => state.selectedMessages); // Get the whole map
  const isSelecting = useChatStore((state) => state.isSelecting);
  const toggleMessageSelection = useChatStore(
    (state) => state.toggleMessageSelection
  );
  // Assume resetMessagesForChannel exists in the store if needed
  // const resetMessagesForChannel = useChatStore((state) => state.resetMessagesForChannel);

  // --- Derive component-specific data using useMemo ---
  const channel = useMemo(
    () => channels.find((c) => c.id === channelId),
    [channels, channelId]
  );

  // Default empty structure for message data
  const defaultMessagesData = useMemo(
    () => ({
      messages: [],
      currentPage: 0,
      lastPage: 1,
      loading: false,
      error: null,
      total: 0,
    }),
    []
  );
  const channelMessagesData = useMemo(
    () => messagesByChannel[channelId] || defaultMessagesData,
    [messagesByChannel, channelId, defaultMessagesData]
  );
  const { messages, currentPage, lastPage, loading, error } =
    channelMessagesData;

  // Derive selected messages for the *current* channel
  const selectedMessages = useMemo(
    () => selectedMessagesMap[channelId] || new Set(),
    [selectedMessagesMap, channelId]
  );
  // --- End Refactored Store Selection ---

  const [editingMessage, setEditingMessage] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const scrollAreaRef = useRef(null);
  const messagesEndRef = useRef(null);
  const topMessageRef = useRef(null);

  // --- Effects (mostly unchanged) ---

  // Fetch initial messages
  useEffect(() => {
    setEditingMessage(null);
    // Use the derived channelMessagesData here
    if (
      channelId &&
      channelMessagesData.currentPage === 0 &&
      !channelMessagesData.loading &&
      channelMessagesData.lastPage >= 1
    ) {
      console.log(`Fetching initial messages for channel ${channelId}`);
      fetchMessages(channelId, 1);
    }
    // Dependency on channelId and the derived data's properties ensures correctness
  }, [
    channelId,
    channelMessagesData.currentPage,
    channelMessagesData.loading,
    channelMessagesData.lastPage,
  ]);

  // Scroll to bottom logic
  useEffect(() => {
    // Only scroll if we have messages and are not in selection mode
    if (messagesEndRef.current && messages.length > 0 && !isSelecting) {
      const scrollViewport = scrollAreaRef.current?.children[1];
      if (scrollViewport) {
        // Scroll more reliably on initial load or if near bottom
        const isNearBottom =
          scrollViewport.scrollHeight -
            scrollViewport.scrollTop -
            scrollViewport.clientHeight <
          250; // Slightly larger threshold
        if (isNearBottom || currentPage === 1) {
          messagesEndRef.current.scrollIntoView({
            behavior: currentPage === 1 ? "auto" : "smooth",
          }); // Auto scroll on first load
        }
      } else {
        messagesEndRef.current.scrollIntoView({ behavior: "auto" });
      }
    }
    // Depend on message count, channel, page number, and selection state
  }, [messages.length, channelId, currentPage, isSelecting]);

  // Intersection Observer for infinite scroll
  const observer = useRef();
  const loadMoreMessages = useCallback(() => {
    if (loading || currentPage >= lastPage || !channelId) return;
    console.log(`Loading page ${currentPage + 1} for channel ${channelId}`);
    fetchMessages(channelId, currentPage + 1);
  }, [channelId, currentPage, lastPage, loading]); // Correct dependencies

  useEffect(() => {
    const scrollViewport = scrollAreaRef.current?.children[1]; // Get viewport for root
    const currentObserver = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && currentPage < lastPage) {
          loadMoreMessages();
        }
      },
      {
        threshold: 0.2, // Trigger a bit earlier
        root: scrollViewport, // Observe within the scrollable viewport
      }
    );

    const currentTopMessageRef = topMessageRef.current;
    if (currentTopMessageRef && scrollViewport) {
      // Ensure viewport exists too
      currentObserver.observe(currentTopMessageRef);
    }

    return () => {
      if (currentTopMessageRef) {
        currentObserver.unobserve(currentTopMessageRef);
      }
      currentObserver.disconnect();
    };
    // Add loading, page states, and scrollViewport as dependencies
  }, [loadMoreMessages, loading, currentPage, lastPage]);

  // Mark messages as read
  useEffect(() => {
    if (channelId && channel && channel.unread_message_count > 0) {
      console.log(`Marking all messages read for channel ${channelId}`);
      const timer = setTimeout(() => {
        emitMarkAllRead(channelId).catch((err) =>
          console.warn("Failed to mark all messages read:", err)
        );
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [channelId, channel]);

  // --- Event Handlers (mostly unchanged) ---

  const handleSendMessage = async (chId, messageText, attachmentId = null) => {
    if (!messageText.trim() && !attachmentId) return;
    if (isSending) return;
    setIsSending(true);
    try {
      if (editingMessage) {
        await emitEditMessage(chId, editingMessage.id, messageText);
        toast.success("Message updated");
        setEditingMessage(null);
      } else {
        await emitSendMessage(chId, messageText, attachmentId);
      }
    } catch (err) {
      console.error("Failed to send/edit message:", err);
      toast.error(`Error: ${err?.message || "Could not send message"}`);
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
    if (window.confirm("Are you sure you want to delete this message?")) {
      try {
        await emitDeleteMessage(channelId, messageId);
        toast.success("Message deleted");
      } catch (err) {
        console.error("Failed to delete message:", err);
        toast.error(`Delete failed: ${err?.message || "Unknown error"}`);
      }
    }
  };

  const handleSelectMessage = (messageId) => {
    if (!channelId) return;
    // Use the toggle function directly from the store
    toggleMessageSelection(channelId, messageId);
  };

  const handleAttachmentUpload = async (file) => {
    if (!channelId || isSending) return;
    setIsSending(true);
    const toastId = toast.loading("Uploading attachment...");
    try {
      const token = useAuthStore.getState().token;
      if (!token) throw new Error("Authentication token not found.");
      const response = await uploadAttachment(token, file);
      if (response.success && response.data?.id) {
        const attachmentId = response.data.id;
        toast.success("Attachment ready!", { id: toastId });
        await handleSendMessage(channelId, "", attachmentId);
      } else {
        throw new Error(response.message || "Upload failed");
      }
    } catch (error) {
      console.error("Attachment Upload/Send failed:", error);
      toast.error(`Attachment Error: ${error.message || "Upload failed"}`, {
        id: toastId,
      });
    } finally {
      setIsSending(false);
    }
  };

  const messagesWithSeparators = useMemo(() => {
    const result = [];
    let lastDate = null;

    messages.forEach((msg, index) => {
      const currentDate = new Date(msg.created_at);
      if (!lastDate || !isSameDay(currentDate, lastDate)) {
        // Add separator
        let dateString;
        if (isToday(currentDate)) {
          dateString = "Today";
        } else if (isYesterday(currentDate)) {
          dateString = "Yesterday";
        } else {
          dateString = format(currentDate, "MMMM d, yyyy");
        }
        result.push(<DateSeparator key={`sep-${msg.id}`} date={dateString} />);
        lastDate = currentDate;
      }
      // Add message bubble
      result.push(
        <MessageBubble
          key={msg.id}
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
  ]); // Include dependencies that affect bubble rendering

  // --- Rendering (mostly unchanged) ---

  if (!channelId) {
    return (
      <div className="flex flex-col h-full items-center justify-center text-muted-foreground bg-muted/20">
        <p>Select a chat to start messaging</p>
      </div>
    );
  }

  if (!channel && loading && currentPage === 0) {
    // More specific loading check
    return (
      <div className="flex flex-col h-full items-center justify-center bg-muted/20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!channel && !loading) {
    return (
      <div className="flex flex-col h-full items-center justify-center text-destructive bg-muted/20">
        Error: Chat not found or failed to load. Try selecting again.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-muted/20 border">
      <ChatWindowHeader
        channel={channel} // Pass the derived channel object
        onBack={onBack}
        onViewContactInfo={onViewContactInfo}
      />

      <ScrollArea ref={scrollAreaRef} className="flex-1 p-4 pb-0">
        {loading && currentPage > 0 && (
          <div className="flex justify-center my-4">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}

        {currentPage < lastPage && messages.length > 0 && !loading && (
          // Use negative margin to hide the 1px div visually but keep for observer
          <div ref={topMessageRef} className="h-1 -mt-1"></div>
        )}

        <div className="space-y-1 pb-4">{messagesWithSeparators}</div>

        {loading && currentPage === 0 && messages.length === 0 && (
          <div className="flex justify-center items-center h-[calc(100%-2rem)]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {error && !loading && (
          <p className="text-center text-destructive p-4">
            Error loading messages: {error}
          </p>
        )}

        {!loading && messages.length === 0 && !error && (
          <div className="flex justify-center items-center h-[calc(100%-2rem)] text-muted-foreground">
            <p>No messages yet. Start the conversation!</p>
          </div>
        )}

        <div ref={messagesEndRef} className="h-1" />
      </ScrollArea>

      <MessageInput
        channelId={channelId}
        onSendMessage={handleSendMessage}
        editingMessage={editingMessage}
        onCancelEdit={handleCancelEdit}
        onAttachmentSelected={handleAttachmentUpload}
        isSending={isSending}
      />
    </div>
  );
};

export default ChatWindow;
