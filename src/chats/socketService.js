// src/chats/socketService.js
import { io } from "socket.io-client";
import useAuthStore from "./useAuthStore";
import useChatStore from "./useChatStore";
import { SOCKET_EVENTS, NODE_SERVER_URL } from "./chatConstants";
import { toast } from "sonner";

let socket = null;

const MESSAGES_PER_PAGE = 20;

export const connectSocket = () => {
  // Prevent multiple connections
  if (socket?.connected) {
    return socket;
  }

  const token = useAuthStore.getState().token;
  if (!token) {
    console.error("Cannot connect socket: No token found.");
    toast.error("Authentication Error", {
      description: "Cannot connect to chat service.",
    });
    return null;
  }

  // Disconnect previous instance if exists but not connected
  if (socket) {
    socket.disconnect();
  }

  socket = io(NODE_SERVER_URL, {
    auth: { token }, // Send token for authentication
    reconnection: true, // Enable auto-reconnection
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  setupSocketListeners(socket);

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    // Optionally reset chat state on explicit disconnect
    // useChatStore.getState().resetChatState();
  }
};

export const getSocket = () => socket; // Function to get the current socket instance

// Centralized place to set up listeners
const setupSocketListeners = (socketInstance) => {
  const {
    setChannels,
    setLoadingChannels,
    setChannelError,
    addMessages,
    setMessagesLoading,
    setMessagesError,
    setActiveChannelId,
    addNewMessage,
    updateExistingMessage,
    removeMessage,
    resetChatState,
    updateChannelInList,
    updateUnreadCount,
    updateChannelUserStatus,
    updateMessageStatuses, // <<< Need this action
    setTypingUser,
    clearTypingUser,
    setTypingTimeoutRef,
    clearTypingTimeoutRef,
    updateAllMessagesDelivered, // <<< NEW Store Action
    updateAllMessagesRead, // <<< NEW Store Action
  } = useChatStore.getState();
  const { setUser } = useAuthStore.getState();
  const { logout } = useAuthStore.getState();
  const currentUserId = useAuthStore.getState().user?.id; // Get current user ID

  socketInstance.on("authenticatedUserData", ({ user }) => {
    if (user) {
      setUser(user); // Set user in the store
    } else {
      console.warn(
        "[Socket Listener] Received invalid user data after authentication."
      );
      // Optional: handle this case, maybe disconnect/logout
    }
  });

  // --- Connection Handling ---
  socketInstance.on(SOCKET_EVENTS.CONNECT, () => {
    toast.success("Connected to chat");
    // Automatically fetch channels on successful connection/reconnection
    fetchChannels();
  });

  socketInstance.on(SOCKET_EVENTS.DISCONNECT, (reason) => {
    console.warn("Socket disconnected:", reason);
    toast.warning("Chat disconnected", {
      description: `Reason: ${reason}. Attempting to reconnect...`,
    });
    // Handle potential cleanup if needed, maybe show overlay
    // If reason is 'io server disconnect', it might be auth failure on reconnect
    if (reason === "io server disconnect") {
      console.error("Server disconnected the socket. Possible auth issue.");
      toast.error("Authentication Failed", {
        description: "Disconnected by server. Please login again.",
      });
      logout(); // Force logout if server rejects connection
      resetChatState();
    }
  });

  socketInstance.on(SOCKET_EVENTS.CONNECT_ERROR, (error) => {
    console.error("Socket connection error:", error.message);
    toast.error("Chat Connection Error", { description: error.message });
    // If the error message indicates auth failure, handle logout
    if (error.message.includes("Authentication error")) {
      logout();
      resetChatState();
    }
  });

  // --- Application Logic Listeners ---

  socketInstance.on(SOCKET_EVENTS.NEW_MESSAGE, ({ channelId, message }) => {
    const storeState = useChatStore.getState(); // Get latest state
    const currentUserId = useAuthStore.getState().user?.id;

    // 1. Add message to store
    storeState.addNewMessage(channelId, message);

    const isMessageFromOther =
      currentUserId &&
      message.created_by?.id &&
      message.created_by.id !== currentUserId;

    // 2. Emit Delivered ACK if message is NOT from the current user
    if (message.created_by?.id && message.created_by.id !== currentUserId) {
      emitMessageDelivered(channelId, message.id); // Send Delivery ACK for this specific message
    } else {
      console.log(
        ` -> Message ${message.id} is from self or missing sender ID. Skipping delivery ACK.`
      );
    }

    // 3. Handle notifications / marking read for active channel
    if (channelId !== storeState.activeChannelId) {
      // Show notification for inactive channel
      toast(`New message in ${message.channel?.name || "chat"}`, {
        description: message.message?.substring(0, 50) + "...",
        // Action needs component context or navigation service
      });
    } else {
      if (isMessageFromOther) {
        // Use a slight delay to allow rendering before marking read (optional but often good UX)
        setTimeout(() => {
          // Check connection again before emitting after delay
          if (getSocket()?.connected) {
            emitMarkMessageRead(channelId, message.id); // <<< EMIT SINGLE READ ACK
          }
        }, 300);
      }
    }
  });

  socketInstance.on(
    SOCKET_EVENTS.MESSAGE_STATUS_UPDATE,
    ({ channelId, updates }) => {
      if (!updates || !Array.isArray(updates) || updates.length === 0) return;

      updateMessageStatuses(channelId, updates); // Handles single updates
    }
  );

  // Handles bulk "Delivered" status updates for a channel
  socketInstance.on(
    SOCKET_EVENTS.CHANNEL_BULK_DELIVERED_UPDATE,
    ({ channelId, delivered_at, actorUserId }) => {
      // Call the Zustand action to update all relevant messages locally
      updateAllMessagesDelivered(channelId, delivered_at, actorUserId);
    }
  );

  // Handles bulk "Read" status updates for a channel
  socketInstance.on(
    SOCKET_EVENTS.CHANNEL_BULK_READ_UPDATE,
    ({ channelId, read_at, actorUserId }) => {
      // Call the Zustand action to update all relevant messages locally
      updateAllMessagesRead(channelId, read_at, actorUserId);
    }
  );

  socketInstance.on(
    SOCKET_EVENTS.CHANNEL_READ_UPDATE,
    ({ channelId, readerUserId, readAt }) => {
      // This specifically handles the unread count based on who read it
      const storeState = useChatStore.getState();
      if (readerUserId === currentUserId) {
        storeState.updateUnreadCount(channelId, 0); // Update local unread count
      }
      // Note: The actual message read statuses are handled by CHANNEL_BULK_READ_UPDATE now
    }
  );

  socketInstance.on(SOCKET_EVENTS.MESSAGE_UPDATED, ({ channelId, message }) => {
    updateExistingMessage(channelId, message);
  });

  socketInstance.on(
    SOCKET_EVENTS.MESSAGE_DELETED,
    ({ channelId, messageId }) => {
      removeMessage(channelId, messageId);
    }
  );

  socketInstance.on("channelMessagesRead", ({ channelId }) => {
    // Update the unread count in the specific channel in the store
    updateUnreadCount(channelId, 0);
  });

  // Listener for general channel updates (e.g., after clearing chat, deleting chat)
  socketInstance.on("channelUpdated", ({ channelData }) => {
    updateChannelInList(channelData); // Need this function in Zustand store
  });

  socketInstance.on("channelDeleted", ({ channelId }) => {
    // Remove channel from store, maybe navigate user away if active
    const { removeChannel, activeChannelId, setActiveChannelId } =
      useChatStore.getState();
    removeChannel(channelId); // Need this function in Zustand store
    if (activeChannelId === channelId) {
      setActiveChannelId(null); // Deselect if active channel is deleted
      // Optionally navigate back to list view on mobile
    }
    toast.info("Chat has been deleted.");
  });

  // Listener for chat cleared event
  socketInstance.on("chatCleared", ({ channelId }) => {
    const { clearMessagesForChannel } = useChatStore.getState(); // Need this function
    clearMessagesForChannel(channelId);
    toast.info("Chat history cleared.");
    // Also likely need to update the channel's latest_message preview
  });

  socketInstance.on("newChannelCreated", ({ channelData }) => {
    // Add or update the channel in the list
    updateChannelInList(channelData);
    toast.info(`New chat started: ${channelData.name}`);
  });

  socketInstance.on("userOnline", ({ userId }) => {
    updateChannelUserStatus(userId, true, null); // Set online, clear lastSeen
  });

  socketInstance.on("userOffline", ({ userId, lastSeen }) => {
    updateChannelUserStatus(userId, false, lastSeen); // Set offline, update lastSeen
  });

  socketInstance.on(
    SOCKET_EVENTS.USER_TYPING,
    ({ channelId, userId, userName }) => {
      // Don't show typing indicator for yourself
      if (userId === currentUserId) return;

      // Clear any existing timeout for this channel (prevents conflicts)
      clearTypingTimeoutRef(channelId);

      // Update store state
      setTypingUser(channelId, { userId, userName });

      // Set a local timeout to clear the indicator if stop event isn't received
      const timeoutId = setTimeout(() => {
        clearTypingUser(channelId, userId); // Clear specific user
      }, 3000); // 3 seconds timeout

      // Store the timeout reference
      setTypingTimeoutRef(channelId, timeoutId);
    }
  );

  // Listener for when another user stops typing
  socketInstance.on(
    SOCKET_EVENTS.USER_STOPPED_TYPING,
    ({ channelId, userId }) => {
      // Don't process stop typing event for yourself
      if (userId === currentUserId) return;

      // Clear the local timeout associated with this channel (if any)
      clearTypingTimeoutRef(channelId);

      // Clear the typing status in the store for this user/channel
      clearTypingUser(channelId, userId);
    }
  );
};

// --- Emitter Functions ---

export const fetchChannels = () => {
  const { setLoadingChannels, setChannels, setChannelError } =
    useChatStore.getState();
  if (!socket || !socket.connected) {
    console.error("Socket not connected. Cannot fetch channels.");
    setChannelError("Not connected to chat service.");
    return;
  }
  setLoadingChannels(true);
  socket.emit(SOCKET_EVENTS.GET_CHANNELS, (response) => {
    if (response.success) {
      setChannels(response.channels);
    } else {
      setChannelError(response.error || "Failed to load channels");
      toast.error("Error Loading Chats", { description: response.error });
    }
  });
};

export const fetchMessages = (channelId, page = 1) => {
  const socket = getSocket();
  // Get necessary store actions
  const { setMessagesLoading, addMessages, setMessagesError } =
    useChatStore.getState();

  if (!socket || !socket.connected) {
    const errorMsg = "Not connected to chat service.";
    console.error("Socket not connected. Cannot fetch messages.");
    setMessagesError(channelId, errorMsg); // Update store with error
    return Promise.reject(new Error(errorMsg)); // Return a rejected promise
  }

  // Set loading state for this specific channel
  setMessagesLoading(channelId, true);
  const limit = MESSAGES_PER_PAGE; // Ensure this constant is defined or imported

  // Return a promise to allow the caller (ChatWindow) to know when it's done (optional)
  return new Promise((resolve, reject) => {
    socket.emit(
      SOCKET_EVENTS.GET_MESSAGES,
      { channelId, page, limit },
      (response) => {
        // Always set loading to false *after* processing the response
        setMessagesLoading(channelId, false); // Set loading false *before* resolving/rejecting

        if (response.success && response.messagesData) {
          // Pass the fetched page number to addMessages
          addMessages(channelId, response.messagesData, page);
          resolve(response.messagesData); // Resolve with the data
        } else {
          const errorMsg = response?.error || "Failed to load messages";
          setMessagesError(channelId, errorMsg); // Update store with error
          toast.error(`Error Loading Messages for Channel ${channelId}`, {
            description: errorMsg,
          });
          reject(new Error(errorMsg)); // Reject with an error object
        }
      }
    );
  });
};

export const emitSendMessage = (channelId, message, attachment_id = null) => {
  if (!socket || !socket.connected) {
    console.error("Socket not connected. Cannot send message.");
    toast.error("Send Error", {
      description: "Not connected to chat service.",
    });
    return Promise.reject("Not connected"); // Return a rejected promise
  }
  // Return a promise to handle success/failure in the component
  return new Promise((resolve, reject) => {
    socket.emit(
      SOCKET_EVENTS.SEND_MESSAGE,
      { channelId, message, attachment_id },
      (response) => {
        if (response.success) {
          // The 'newMessage' listener will handle adding it to the store
          resolve(response.message);
        } else {
          console.error("Failed to send message:", response.error);
          toast.error("Send Error", { description: response.error });
          reject(response.error);
        }
      }
    );
  });
};

export const emitEditMessage = (channelId, messageId, message) => {
  if (!socket || !socket.connected) return Promise.reject("Not connected");
  return new Promise((resolve, reject) => {
    socket.emit(
      SOCKET_EVENTS.EDIT_MESSAGE,
      { channelId, messageId, message },
      (response) => {
        if (response.success) {
          resolve(response.message);
        } else {
          toast.error("Edit Error", { description: response.error });
          reject(response.error);
        }
      }
    );
  });
};

export const emitDeleteMessage = (channelId, messageId) => {
  if (!socket || !socket.connected) return Promise.reject("Not connected");
  return new Promise((resolve, reject) => {
    socket.emit(
      SOCKET_EVENTS.DELETE_MESSAGE,
      { channelId, messageId },
      (response) => {
        if (response.success) {
          resolve();
        } else {
          toast.error("Delete Error", { description: response.error });
          reject(response.error);
        }
      }
    );
  });
};

export const emitMarkMessageRead = (channelId, messageId) => {
  const socket = getSocket();
  if (socket && socket.connected && channelId && messageId) {
    socket.emit(
      SOCKET_EVENTS.MARK_MESSAGE_READ,
      { channelId, messageId },
      (response) => {
        if (!response?.success) {
          console.warn(
            `[Socket Emitter] Server failed to mark message ${messageId} as read: ${response?.error}`
          );
        }
      }
    );
  }
};

export const emitMarkAllRead = (channelId) => {
  const socket = getSocket();
  if (!socket || !socket.connected)
    return Promise.reject(new Error("Not connected"));

  return new Promise((resolve, reject) => {
    socket.emit(SOCKET_EVENTS.MARK_CHANNEL_READ, { channelId }, (response) => {
      if (response?.success) {
        resolve();
      } else {
        console.warn(
          `[Socket Emitter] Mark channel ${channelId} read ACK received: Failed - ${response?.error}`
        );
        reject(new Error(response?.error || "Failed on server"));
      }
    });
  });
};

export const emitMarkAllDelivered = (channelId) => {
  const socket = getSocket();
  if (!socket || !socket.connected)
    return Promise.reject(new Error("Not connected"));

  return new Promise((resolve, reject) => {
    socket.emit(
      SOCKET_EVENTS.MARK_CHANNEL_DELIVERED,
      { channelId },
      (response) => {
        if (response?.success) {
          resolve();
        } else {
          console.warn(
            `[Socket Emitter] Mark channel ${channelId} delivered ACK received: Failed - ${response?.error}`
          );
          reject(new Error(response?.error || "Failed on server"));
        }
      }
    );
  });
};

export const emitClearChat = (channelId) => {
  const socket = getSocket(); // Get current socket instance
  if (!socket || !socket.connected) {
    console.error("Socket not connected. Cannot clear chat.");
    toast.error("Action Failed", {
      description: "Not connected to chat service.",
    });
    return Promise.reject(new Error("Not connected")); // Return rejected promise with Error object
  }
  // Return a promise to handle success/failure in the component
  return new Promise((resolve, reject) => {
    // Ensure the event name matches the one in node-server/socket/handlers.js
    socket.emit("clearChannelChat", { channelId }, (response) => {
      if (response?.success) {
        // The 'chatCleared' listener should handle the state update
        resolve();
      } else {
        const errorMsg = response?.error || "Failed to clear chat on server";
        console.error(
          `Failed to clear chat for channel ${channelId}: ${errorMsg}`
        );
        // Toast is likely handled in the component calling this
        reject(new Error(errorMsg)); // Reject with an Error object
      }
    });
  });
};

export const emitDeleteChannel = (channelId) => {
  const socket = getSocket(); // Get current socket instance
  if (!socket || !socket.connected) {
    console.error("Socket not connected. Cannot delete channel.");
    toast.error("Action Failed", {
      description: "Not connected to chat service.",
    });
    return Promise.reject(new Error("Not connected")); // Return rejected promise with Error object
  }
  // Return a promise
  return new Promise((resolve, reject) => {
    // Ensure the event name matches the one in node-server/socket/handlers.js
    socket.emit("deleteChannel", { channelId }, (response) => {
      if (response?.success) {
        // The 'channelDeleted' listener should handle the state update
        resolve();
      } else {
        const errorMsg =
          response?.error || "Failed to delete channel on server";
        console.error(`Failed to delete channel ${channelId}: ${errorMsg}`);
        // Toast is likely handled in the component calling this
        reject(new Error(errorMsg)); // Reject with an Error object
      }
    });
  });
};

export const emitCreateChannel = (userId) => {
  const socket = getSocket();
  if (!socket || !socket.connected) {
    console.error("Socket not connected. Cannot create channel.");
    toast.error("Action Failed", {
      description: "Not connected to chat service.",
    });
    return Promise.reject(new Error("Not connected"));
  }

  // We only support 1-on-1 chat creation for now via this UI
  const userIds = [userId]; // Send as an array as per backend expectation
  const isGroup = 0; // Explicitly 1-on-1 chat

  // Return a promise
  return new Promise((resolve, reject) => {
    // Event name should match Node handler
    socket.emit(
      "createChannel",
      {
        userIds,
        is_group:
          isGroup /* you might need other fields like name/description for groups later */,
      },
      (response) => {
        if (response?.success) {
          // response.channel should contain the data for the newly created or existing channel
          resolve(response.channel);
        } else {
          const errorMsg =
            response?.error || "Failed to create/find channel on server";
          console.error(`Failed to create channel: ${errorMsg}`);
          reject(new Error(errorMsg));
        }
      }
    );
  });
};

export const emitStartTyping = (channelId) => {
  const socket = getSocket();
  if (socket && socket.connected && channelId) {
    socket.emit(SOCKET_EVENTS.START_TYPING, { channelId });
  }
};

export const emitStopTyping = (channelId) => {
  const socket = getSocket();
  if (socket && socket.connected && channelId) {
    socket.emit(SOCKET_EVENTS.STOP_TYPING, { channelId });
  }
};

export const emitMessageDelivered = (channelId, messageId) => {
  const socket = getSocket();
  if (socket && socket.connected && channelId && messageId) {
    socket.emit(SOCKET_EVENTS.MESSAGE_DELIVERED_ACK, { channelId, messageId });
    // No callback needed for simple ACK
  }
};

// Add emitters for other actions (markDelivered, channel operations...)
