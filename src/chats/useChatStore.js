// src/components/chats/useChatStore.js
import { create } from "zustand";
import { produce } from "immer"; // Optional: For easier nested state updates
import useAuthStore from "./useAuthStore";

const defaultChannelMessageState = {
  messages: [],
  currentPage: 0, // Keep currentPage if API uses it, though less relevant client-side after load
  lastPage: 1,
  total: 0,
  loading: false,
  error: null,
};

const useChatStore = create((set, get) => ({
  channels: [], // Array of channel objects from PHP
  activeChannelId: null,
  messages: {}, // { channelId: { messages: [], currentPage: 1, lastPage: 1, total: 0, loading: false, error: null } }
  loadingChannels: false,
  channelError: null,
  selectedMessages: {}, // { channelId: Set<messageId> }
  isSelecting: false, // Flag for selection mode

  // Typing status state: { channelId: { userId: number, userName: string } | null }
  // Stores who is currently typing in which channel (null if no one)
  // For groups later, this could be an array: { channelId: Array<{userId, userName}> }
  typingStatus: {},
  // Store local timeouts for clearing typing indicators if stop event is missed
  typingTimeouts: {},

  setChannels: (channels) =>
    set(
      produce((state) => {
        // Sort channels by latest message timestamp (descending)
        channels.sort((a, b) => {
          const dateA = a.latest_message
            ? new Date(a.latest_message.created_at)
            : new Date(0);
          const dateB = b.latest_message
            ? new Date(b.latest_message.created_at)
            : new Date(0);
          return dateB - dateA;
        });
        state.channels = channels;
        state.loadingChannels = false;
        state.channelError = null;
      })
    ),
  setLoadingChannels: (loading) => set({ loadingChannels: loading }),
  setChannelError: (error) =>
    set({ channelError: error, loadingChannels: false }),

  setActiveChannelId: (channelId) =>
    set(
      produce((state) => {
        // Clear local timeout for previous channel
        if (
          state.activeChannelId &&
          state.typingTimeouts[state.activeChannelId]
        ) {
          clearTimeout(state.typingTimeouts[state.activeChannelId]);
          delete state.typingTimeouts[state.activeChannelId];
        }

        state.activeChannelId = channelId;
        state.isSelecting = false; // Reset selection when changing channels
        // Ensure selectedMessages is an empty object, not just resetting one channel
        state.selectedMessages = {};
        // Initialize message state for the new channel if it doesn't exist
        if (channelId && !state.messages[channelId]) {
          state.messages[channelId] = { ...defaultChannelMessageState };
        }
      })
    ),

  // --- Message Management ---
  setMessagesLoading: (channelId, loading) =>
    set(
      produce((state) => {
        // Initialize if doesn't exist
        if (!state.messages[channelId]) {
          state.messages[channelId] = { ...defaultChannelMessageState };
        }
        state.messages[channelId].loading = loading;
        if (loading) {
          state.messages[channelId].error = null;
        }
      })
    ),
  setMessagesError: (channelId, error) =>
    set(
      produce((state) => {
        // Don't initialize here, assume it exists if error occurs
        if (state.messages[channelId]) {
          state.messages[channelId].loading = false;
          state.messages[channelId].error = error;
        } else {
          console.warn(
            `setMessagesError called for uninitialized channel ${channelId}`
          );
          // Initialize with error state if needed
          state.messages[channelId] = {
            ...defaultChannelMessageState,
            error: error,
            loading: false,
          };
        }
      })
    ),
  addMessages: (
    channelId,
    messagesData,
    fetchedPage // Page number that was just successfully fetched
  ) =>
    set(
      produce((state) => {
        // Ensure initialized (safe check)
        if (!state.messages[channelId]) {
          state.messages[channelId] = { ...defaultChannelMessageState };
        }
        const channelState = state.messages[channelId];
        const existingMessages = channelState.messages;
        const newMessages = messagesData.messages || [];

        // Filter out duplicates
        const existingMessageIds = new Set(existingMessages.map((m) => m.id));
        const uniqueNewMessages = newMessages.filter(
          (newMsg) => !existingMessageIds.has(newMsg.id)
        );

        // Prepend older messages (newly fetched) to the existing ones
        const combined = [...uniqueNewMessages, ...existingMessages];

        // Sort combined array by creation date (ascending)
        combined.sort(
          (a, b) => new Date(a.created_at) - new Date(b.created_at)
        );

        channelState.messages = combined;
        channelState.lastPage = messagesData.last_page || 1; // Use backend's last_page
        channelState.total = messagesData.total_record || 0;
        // **** THIS IS THE KEY FIX ****
        // Update currentPage to the page number that was just fetched
        channelState.currentPage = fetchedPage;
        // **** END KEY FIX ****
        channelState.loading = false; // Ensure loading is false after adding
        channelState.error = null; // Clear any previous error
      })
    ),

  addNewMessage: (channelId, message) =>
    set(
      produce((state) => {
        // Ensure initialized
        if (!state.messages[channelId]) {
          state.messages[channelId] = { ...defaultChannelMessageState };
        }

        const messageList = state.messages[channelId].messages;
        const existingIndex = messageList.findIndex((m) => m.id === message.id);

        // Append ONLY if it doesn't exist.
        if (existingIndex === -1) {
          // Push new message to the end (most recent)
          messageList.push(message);
          // Ensure total is updated correctly
          state.messages[channelId].total =
            (state.messages[channelId].total || 0) + 1;
          // Check if adding this message means we are now on the last page (if previously not)
          // This might need more complex logic if total % per_page === 1, etc.
          // Let's rely on the backend's lastPage value for now.
        } else {
          // Optionally update if it exists (e.g., status change came with it)
          messageList[existingIndex] = {
            ...messageList[existingIndex],
            ...message,
          };
          console.warn(
            `addNewMessage: Message ID ${message.id} already exists. Updated in place.`
          );
        }

        // Update Channel List Preview
        const channelIndex = state.channels.findIndex(
          (c) => c.id === channelId
        );
        if (channelIndex > -1) {
          state.channels[channelIndex].latest_message = message; // Update latest message
          const currentUserId = useAuthStore.getState().user?.id;
          const isActiveChannel = state.activeChannelId === channelId;
          const isMessageFromOther =
            message.created_by?.id && message.created_by.id !== currentUserId;

          // Increment unread count ONLY if channel is NOT active AND message is from another user
          if (!isActiveChannel && isMessageFromOther) {
            state.channels[channelIndex].unread_message_count =
              (state.channels[channelIndex].unread_message_count || 0) + 1;
          }
          // If channel IS active, the channelReadUpdate listener (triggered by emitMarkAllRead) will reset the count later.
          // We don't need to reset it here.
        }
        // Re-sort channels after adding new message to bring recent chat to top
        state.channels.sort((a, b) => {
          const dateA = a.latest_message
            ? new Date(a.latest_message.created_at)
            : new Date(0);
          const dateB = b.latest_message
            ? new Date(b.latest_message.created_at)
            : new Date(0);
          return dateB - dateA;
        });
      })
    ),

  updateExistingMessage: (channelId, updatedMessageData) =>
    set(
      produce((state) => {
        if (!state.messages[channelId]?.messages) return; // No messages loaded for this channel

        const messageIndex = state.messages[channelId].messages.findIndex(
          (m) => m.id === updatedMessageData.id
        );

        if (messageIndex !== -1) {
          // Merge existing message with updates
          state.messages[channelId].messages[messageIndex] = {
            ...state.messages[channelId].messages[messageIndex],
            ...updatedMessageData,
          };

          // Update latest message in channel list if it was the one updated
          const channelIndex = state.channels.findIndex(
            (c) => c.id === channelId
          );
          if (
            channelIndex > -1 &&
            state.channels[channelIndex].latest_message?.id ===
              updatedMessageData.id
          ) {
            state.channels[channelIndex].latest_message = {
              ...state.channels[channelIndex].latest_message,
              ...updatedMessageData,
            };
          }
        } else {
          console.warn(
            `updateExistingMessage: Message ID ${updatedMessageData.id} not found in channel ${channelId}`
          );
        }
      })
    ),

  removeMessage: (channelId, messageId) =>
    set(
      produce((state) => {
        if (state.messages[channelId]) {
          const initialLength = state.messages[channelId].messages.length;
          state.messages[channelId].messages = state.messages[
            channelId
          ].messages.filter((m) => m.id !== messageId);
          const finalLength = state.messages[channelId].messages.length;
          // Decrement total if a message was actually removed
          if (finalLength < initialLength) {
            state.messages[channelId].total = Math.max(
              0,
              (state.messages[channelId].total || 0) - 1
            );
          }
        }
        // Update channel list preview if the deleted message was the latest one
        const channelIndex = state.channels.findIndex(
          (c) => c.id === channelId
        );
        if (
          channelIndex > -1 &&
          state.channels[channelIndex].latest_message?.id === messageId
        ) {
          // Find the new latest message (the one before the deleted one in the sorted list)
          const remainingMessages = state.messages[channelId]?.messages || [];
          if (remainingMessages.length > 0) {
            // Messages are sorted ascending, so the last one is the newest
            state.channels[channelIndex].latest_message =
              remainingMessages[remainingMessages.length - 1];
          } else {
            state.channels[channelIndex].latest_message = null; // No messages left
          }
          // Re-sort channels list might be needed if sorting relies on latest_message content/time
          state.channels.sort((a, b) => {
            /* ... sort logic ... */
          });
        }
      })
    ),

  clearMessagesForChannel: (channelId) =>
    set(
      produce((state) => {
        if (state.messages[channelId]) {
          state.messages[channelId].messages = [];
          state.messages[channelId].currentPage = 0; // Reset pagination
          state.messages[channelId].lastPage = 1;
          state.messages[channelId].total = 0;
          state.messages[channelId].loading = false;
          state.messages[channelId].error = null;
        }
        const channelIndex = state.channels.findIndex(
          (c) => c.id === channelId
        );
        if (channelIndex > -1) {
          state.channels[channelIndex].latest_message = null;
          state.channels[channelIndex].unread_message_count = 0;
          // Re-sort channels list might be needed
          state.channels.sort((a, b) => {
            /* ... sort logic ... */
          });
        }
      })
    ),

  // --- Message Selection ---
  toggleMessageSelection: (channelId, messageId) =>
    set(
      produce((state) => {
        if (!state.selectedMessages[channelId]) {
          state.selectedMessages[channelId] = new Set();
        }
        const selectedSet = state.selectedMessages[channelId];
        if (selectedSet.has(messageId)) {
          selectedSet.delete(messageId);
        } else {
          selectedSet.add(messageId);
        }
        // Update isSelecting flag
        let hasSelection = false;
        for (const chId in state.selectedMessages) {
          if (state.selectedMessages[chId].size > 0) {
            hasSelection = true;
            break;
          }
        }
        state.isSelecting = hasSelection;

        // If last message is deselected, turn off selection mode
        if (selectedSet.size === 0) {
          let anySelected = false;
          for (const chId in state.selectedMessages) {
            if (state.selectedMessages[chId].size > 0) {
              anySelected = true;
              break;
            }
          }
          if (!anySelected) state.isSelecting = false;
        }
      })
    ),
  clearSelection: (channelId = null) =>
    set(
      produce((state) => {
        if (channelId && state.selectedMessages[channelId]) {
          state.selectedMessages[channelId].clear();
        } else if (!channelId) {
          // Clear all selections
          state.selectedMessages = {};
        }
        state.isSelecting = false; // Always turn off selection mode when clearing
      })
    ),

  updateUnreadCount: (channelId, count) =>
    set(
      produce((state) => {
        const channelIndex = state.channels.findIndex(
          (c) => c.id === channelId
        );
        if (channelIndex > -1) {
          if (state.channels[channelIndex].unread_message_count !== count) {
            state.channels[channelIndex].unread_message_count = count;
          }
        } else {
          console.warn(
            `[Zustand Store] updateUnreadCount: Channel ${channelId} not found.`
          );
        }
      })
    ),

  updateChannelInList: (updatedChannelData) =>
    set(
      produce((state) => {
        const index = state.channels.findIndex(
          (c) => c.id === updatedChannelData.id
        );
        if (index > -1) {
          // Merge existing data with new data, preserving fields not in updatedChannelData if necessary
          state.channels[index] = {
            ...state.channels[index],
            ...updatedChannelData,
          };
        } else {
          // If channel wasn't in the list (e.g., new channel created by other user), add it
          state.channels.unshift(updatedChannelData); // Add to top (or sort later)
        }
        // Re-sort channels after update
        state.channels.sort((a, b) => {
          const dateA = a.latest_message
            ? new Date(a.latest_message.created_at)
            : new Date(a.created_at || 0);
          const dateB = b.latest_message
            ? new Date(b.latest_message.created_at)
            : new Date(b.created_at || 0);
          return dateB - dateA;
        });
      })
    ),

  removeChannel: (channelId) =>
    set(
      produce((state) => {
        state.channels = state.channels.filter((c) => c.id !== channelId);
        // Also remove messages if loaded
        if (state.messages[channelId]) {
          delete state.messages[channelId];
        }
        // Clear selection for this channel
        if (state.selectedMessages[channelId]) {
          delete state.selectedMessages[channelId];
        }
        // If the active channel was deleted, reset activeChannelId
        if (state.activeChannelId === channelId) {
          state.activeChannelId = null;
        }
      })
    ),

  updateChannelUserStatus: (userId, isOnline, lastSeenAt) =>
    set(
      produce((state) => {
        state.channels.forEach((channel, index) => {
          // Find channels involving this user (assuming 1-on-1 for now)
          // Need 'user_id' on the channel object from PHP response!
          if (!channel.is_group && channel.user_id === userId) {
            state.channels[index].is_online = isOnline;
            state.channels[index].last_seen_at = lastSeenAt; // Add last_seen_at field
          }
          // TODO: Handle group chats - need member list within channel data? Or separate presence update?
        });
      })
    ),

  // --- Actions for Typing ---
  setTypingUser: (channelId, user) =>
    set(
      produce((state) => {
        // Simple implementation for 1-on-1: Overwrite typing user for the channel
        state.typingStatus[channelId] = user; // user = { userId, userName }
      })
    ),

  clearTypingUser: (channelId, userIdToClear) =>
    set(
      produce((state) => {
        // Clear only if the user matches or if no specific user is given
        if (
          state.typingStatus[channelId] &&
          (!userIdToClear ||
            state.typingStatus[channelId].userId === userIdToClear)
        ) {
          state.typingStatus[channelId] = null;
        }
      })
    ),

  // Store local timeout reference
  setTypingTimeoutRef: (channelId, timeoutId) =>
    set(
      produce((state) => {
        state.typingTimeouts[channelId] = timeoutId;
      })
    ),

  // Clear local timeout reference
  clearTypingTimeoutRef: (channelId) =>
    set(
      produce((state) => {
        if (state.typingTimeouts[channelId]) {
          clearTimeout(state.typingTimeouts[channelId]); // Clear the actual timeout
          delete state.typingTimeouts[channelId]; // Remove reference
        }
      })
    ),

  updateMessageStatuses: (channelId, updates) =>
    set(
      produce((state) => {
        const channelMessages = state.messages?.[channelId];
        if (!channelMessages || !Array.isArray(channelMessages.messages)) {
          /* skip */ return;
        }

        // Create a map for efficient lookup
        const messageMap = new Map(
          state.messages[channelId].messages.map((msg) => [msg.id, msg])
        );

        // let latestMessageInChannelWasUpdated = false;
        // const latestMessageIdInChannel = state.channels.find(
        //   (c) => c.id === channelId
        // )?.latest_message?.id;

        // Apply updates from the array
        updates.forEach((update) => {
          const message = messageMap.get(update.messageId);
          if (message) {
            let changed = false;
            if (
              update.delivered_at &&
              (!message.delivered_at ||
                new Date(update.delivered_at) > new Date(message.delivered_at))
            ) {
              message.delivered_at = update.delivered_at;
              changed = true;
            }
            if (
              update.read_at &&
              (!message.read_at ||
                new Date(update.read_at) > new Date(message.read_at))
            ) {
              message.read_at = update.read_at;
              changed = true;
            }
            // if (changed && message.id === latestMessageIdInChannel) { latestMessageInChannelWasUpdated = true; } // <-- Remove check
          } // else { /* warn message not found */ }
        });

        state.messages[channelId].messages = Array.from(messageMap.values());
      })
    ),

  // Handles BULK delivered updates <<< NEW ACTION
  updateAllMessagesDelivered: (channelId, deliveredAt, actorUserId) =>
    set(
      produce((state) => {
        const channelMessages = state.messages?.[channelId];
        if (
          !channelMessages ||
          !Array.isArray(channelMessages.messages) ||
          channelMessages.messages.length === 0
        ) {
          return;
        }
        if (
          !channelMessages ||
          !Array.isArray(channelMessages.messages) ||
          channelMessages.messages.length === 0
        ) {
          console.warn(
            `[Zustand Store] Messages not loaded or invalid structure for channel ${channelId}. Cannot update delivered status.`
          );
          return;
        }
        // **** END CHECKS ****

        const currentUserId = useAuthStore.getState().user?.id;
        // let latestMessageInChannelWasUpdated = false;
        // const channelIndex = state.channels.findIndex(
        //   (c) => c.id === channelId
        // ); // Find channel index *once*
        // const latestMessageIdInChannel =
        //   channelIndex > -1
        //     ? state.channels[channelIndex]?.latest_message?.id
        //     : null;

        channelMessages.messages.forEach((message) => {
          const senderId = message?.created_by?.id;
          const isMessageFromOther =
            typeof senderId !== "undefined" && senderId !== currentUserId;

          if (
            isMessageFromOther &&
            (!message.delivered_at ||
              new Date(deliveredAt) > new Date(message.delivered_at))
          ) {
            message.delivered_at = deliveredAt;
            // if (message.id === latestMessageIdInChannel) { latestMessageInChannelWasUpdated = true; } // <-- Remove check
          }
        });

        // if (latestMessageInChannelWasUpdated && channelIndex > -1) {
        //   // Update channel list preview more carefully
        //   const updatedLatestMessage = state.messages[channelId].messages.find(
        //     (m) => m.id === latestMessageIdInChannel
        //   );
        //   if (updatedLatestMessage) {
        //     state.channels[channelIndex].latest_message = {
        //       // Ensure full merge if needed
        //       ...state.channels[channelIndex].latest_message,
        //       ...updatedLatestMessage, // Apply latest status
        //     };
        //   }
        // }
      })
    ),

  // Handles BULK read updates <<< NEW ACTION
  updateAllMessagesRead: (channelId, readAt, actorUserId) =>
    set(
      produce((state) => {
        const channelMessages = state.messages?.[channelId];
        if (
          !channelMessages ||
          !Array.isArray(channelMessages.messages) ||
          channelMessages.messages.length === 0
        ) {
          return;
        }

        const currentUserId = useAuthStore.getState().user?.id;
        // let latestMessageInChannelWasUpdated = false;
        // const latestMessageIdInChannel = state.channels.find(
        //   (c) => c.id === channelId
        // )?.latest_message?.id;

        channelMessages.messages.forEach((message) => {
          const senderId = message?.created_by?.id;
          const isMessageFromOther =
            typeof senderId !== "undefined" && senderId !== currentUserId;

          if (
            isMessageFromOther &&
            (!message.read_at ||
              new Date(readAt) > new Date(message.read_at)) &&
            (!message.delivered_at ||
              new Date(readAt) >= new Date(message.delivered_at))
          ) {
            message.read_at = readAt;
            if (
              !message.delivered_at ||
              new Date(readAt) > new Date(message.delivered_at)
            ) {
              message.delivered_at = readAt;
            }
            // if (message.id === latestMessageIdInChannel) { latestMessageInChannelWasUpdated = true; } // <-- Remove check
          }
        });
      })
    ),

  // Utility to reset messages (e.g., on error)
  resetMessagesForChannel: (channelId) =>
    set(
      produce((state) => {
        if (state.messages[channelId]) {
          state.messages[channelId] = {
            messages: [],
            currentPage: 0,
            lastPage: 1,
            total: 0,
            loading: false,
            error: null,
          };
        }
      })
    ),

  // --- Reset ---
  resetChatState: () =>
    set({
      channels: [],
      activeChannelId: null,
      messages: {},
      loadingChannels: false,
      channelError: null,
      selectedMessages: {},
      isSelecting: false,
      typingStatus: {}, // Reset typing status
      typingTimeouts: {}, // Reset timeouts
    }),
}));

export default useChatStore;
