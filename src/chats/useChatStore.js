// frontend/src/store/useChatStore.js
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
  oldestPageFetched: 0, // Ensure initialized to 0
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
        // Optional: Clear typing indicator for the channel we are leaving
        // if (state.activeChannelId && state.typingStatus[state.activeChannelId]) {
        //     state.typingStatus[state.activeChannelId] = null;
        // }
        // Clear local timeout for previous channel
        if (
          state.activeChannelId &&
          state.typingTimeouts[state.activeChannelId]
        ) {
          clearTimeout(state.typingTimeouts[state.activeChannelId]);
          delete state.typingTimeouts[state.activeChannelId];
        }

        state.activeChannelId = channelId;
        state.isSelecting = false;
        state.selectedMessages = {};
        if (channelId && !state.messages[channelId]) {
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
        }
      })
    ),
  addMessages: (
    channelId,
    messagesData,
    fetchedPage // Keep fetchedPage argument
  ) =>
    set(
      produce((state) => {
        // Ensure initialized
        if (!state.messages[channelId]) {
          state.messages[channelId] = { ...defaultChannelMessageState };
        }
        const channelState = state.messages[channelId];
        const existingMessages = channelState.messages;
        const newMessages = messagesData.messages || [];

        const uniqueNewMessages = newMessages.filter(
          (newMsg) => !existingMessages.some((exMsg) => exMsg.id === newMsg.id)
        );

        // Prepend older messages
        const combined = [...uniqueNewMessages, ...existingMessages];
        combined.sort(
          (a, b) => new Date(a.created_at) - new Date(b.created_at)
        );

        channelState.messages = combined;
        channelState.lastPage = messagesData.last_page;
        channelState.total = messagesData.total_record;
        // Update oldestPageFetched correctly
        channelState.oldestPageFetched = Math.max(
          channelState.oldestPageFetched || 0,
          fetchedPage
        );
        channelState.loading = false;
        channelState.error = null;
        channelState.oldestPageFetched = Math.max(
          channelState.oldestPageFetched || 0,
          fetchedPage
        );
        console.log(
          `Store: Added page ${fetchedPage} for channel ${channelId}. Oldest fetched: ${channelState.oldestPageFetched}`
        );
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

        if (existingIndex === -1) {
          messageList.push(message); // Append new message
          state.messages[channelId].total =
            (state.messages[channelId].total || 0) + 1;
        } else {
          console.warn(
            `addNewMessage: Message ID ${message.id} already exists. Updating.`
          );
          messageList[existingIndex] = message; // Update if exists (e.g., correction)
        }

        // Update Channel List Preview
        const channelIndex = state.channels.findIndex(
          (c) => c.id === channelId
        );
        if (channelIndex > -1) {
          state.channels[channelIndex].latest_message = message;
          const currentUserId = useAuthStore.getState().user?.id; // Get current user ID
          if (
            state.activeChannelId !== channelId &&
            message.created_by?.id !== currentUserId
          ) {
            state.channels[channelIndex].unread_message_count =
              (state.channels[channelIndex].unread_message_count || 0) + 1;
          } else if (state.activeChannelId === channelId) {
            state.channels[channelIndex].unread_message_count = 0;
          }
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
  updateMessageStatuses: (
    channelId,
    updates // updates = [{ messageId, read_at?, delivered_at? }]
  ) =>
    set(
      produce((state) => {
        if (!state.messages[channelId]?.messages) return;

        const messageMap = new Map(
          state.messages[channelId].messages.map((msg) => [msg.id, msg])
        );
        let latestMessageUpdated = false;
        const latestMsgIdInChannel = state.channels.find(
          (c) => c.id === channelId
        )?.latest_message?.id;

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
            if (changed && message.id === latestMsgIdInChannel) {
              latestMessageUpdated = true; // Mark if the latest message needs update in channel list
            }
          }
        });

        // Update messages array from map
        state.messages[channelId].messages = Array.from(messageMap.values());

        // Update latest_message in channels list if it was affected
        if (latestMessageUpdated) {
          const channelIndex = state.channels.findIndex(
            (c) => c.id === channelId
          );
          if (channelIndex > -1) {
            // Find the full updated message object from our map
            const updatedLatest = messageMap.get(latestMsgIdInChannel);
            if (updatedLatest) {
              state.channels[channelIndex].latest_message = updatedLatest;
            }
          }
        }
      })
    ),
  removeMessage: (channelId, messageId) =>
    set(
      produce((state) => {
        if (state.messages[channelId]) {
          state.messages[channelId].messages = state.messages[
            channelId
          ].messages.filter((m) => m.id !== messageId);
        }
        // Also update the latest message in the channels list if it's the one deleted
        const channelIndex = state.channels.findIndex(
          (c) => c.id === channelId
        );
        if (
          channelIndex > -1 &&
          state.channels[channelIndex].latest_message?.id === messageId
        ) {
          // Need to fetch the *new* latest message or set to null/placeholder
          // Simplification: set latest_message to null or find previous one (complex)
          // For now, just remove it visually from the message list
          // TODO: A better approach would be to refetch channel list or have backend push new latest message
          console.warn(
            "Latest message deleted, channel list preview might be outdated. Re-fetch channels recommended."
          );
          // state.channels[channelIndex].latest_message = null; // Or fetch previous
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
          state.channels[channelIndex].unread_message_count = count;
          // Optionally re-sort if sorting depends on unread count
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

  clearMessagesForChannel: (channelId) =>
    set(
      produce((state) => {
        if (state.messages[channelId]) {
          state.messages[channelId].messages = [];
          // Reset pagination? Maybe not necessary if backend handles it.
          // state.messages[channelId].currentPage = 1;
          // state.messages[channelId].lastPage = 1;
          state.messages[channelId].total = 0;
        }
        // Also update the channel list preview
        const channelIndex = state.channels.findIndex(
          (c) => c.id === channelId
        );
        if (channelIndex > -1) {
          state.channels[channelIndex].latest_message = null; // Clear latest message preview
          state.channels[channelIndex].unread_message_count = 0; // Assume cleared means read
          // Re-sort might be needed if latest_message becomes null
          state.channels.sort((a, b) => {
            /* ... sort logic ... */
          });
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
        if (!state.messages[channelId]?.messages) return; // Channel messages not loaded

        // Create a map for faster lookup
        const messageMap = new Map(
          state.messages[channelId].messages.map((msg) => [msg.id, msg])
        );

        updates.forEach((update) => {
          const message = messageMap.get(update.messageId);
          if (message) {
            // Only update if the new timestamp is later (or first time)
            if (
              update.delivered_at &&
              (!message.delivered_at ||
                new Date(update.delivered_at) > new Date(message.delivered_at))
            ) {
              message.delivered_at = update.delivered_at;
            }
            if (
              update.read_at &&
              (!message.read_at ||
                new Date(update.read_at) > new Date(message.read_at))
            ) {
              message.read_at = update.read_at;
            }
          }
        });

        // Update the messages array (Immer handles immutability)
        state.messages[channelId].messages = Array.from(messageMap.values());

        // Also update the latest message in the channel list if affected
        const channelIndex = state.channels.findIndex(
          (c) => c.id === channelId
        );
        if (channelIndex > -1 && state.channels[channelIndex].latest_message) {
          const latestMsgId = state.channels[channelIndex].latest_message.id;
          const updateForLatest = updates.find(
            (u) => u.messageId === latestMsgId
          );
          if (updateForLatest) {
            if (updateForLatest.delivered_at)
              state.channels[channelIndex].latest_message.delivered_at =
                updateForLatest.delivered_at;
            if (updateForLatest.read_at)
              state.channels[channelIndex].latest_message.read_at =
                updateForLatest.read_at;
          }
        }
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
