// frontend/src/chats/socketService.js
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
    console.log("Socket already connected.");
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

  console.log("Attempting to connect socket...");
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
    console.log("Disconnecting socket...");
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
  } = useChatStore.getState();
  const { logout } = useAuthStore.getState();
  const { updateChannelInList, updateUnreadCount } = useChatStore.getState();
  const { updateChannelUserStatus } = useChatStore.getState(); // Add this action to store
  const { updateMessageStatuses } = useChatStore.getState();
  const {
    setTypingUser,
    clearTypingUser,
    setTypingTimeoutRef,
    clearTypingTimeoutRef,
  } = useChatStore.getState();
  const currentUserId = useAuthStore.getState().user?.id; // Get current user ID

  // --- Connection Handling ---
  socketInstance.on(SOCKET_EVENTS.CONNECT, () => {
    console.log("Socket connected successfully:", socketInstance.id);
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
    console.log("Received new message:", message);
    addNewMessage(channelId, message);
    // TODO: Add notification for inactive channels
    const activeChannelId = useChatStore.getState().activeChannelId;
    const currentUserId = useAuthStore.getState().user?.id;
    // Add message to store (existing logic)
    useChatStore.getState().addNewMessage(channelId, message);

    // If message was NOT sent by me, emit delivered ACK
    if (message.created_by?.id !== currentUserId) {
      emitMessageDelivered(channelId, message.id);
    }

    if (channelId !== activeChannelId) {
      toast(`New message in ${message.created_by?.first_name || "chat"}`, {
        // Use Shadcn Toaster
        description: message.message.substring(0, 50) + "...",
        // action: { label: "View", onClick: () => setActiveChannelId(channelId) } // Requires component context
      });
    } else {
      // If in the active channel, maybe mark as read automatically or based on visibility
      emitMarkMessageRead(channelId, message.id); // Example
    }
  });

  // --- Listener for status updates (delivered/read) ---
  // socketInstance.on(
  //   SOCKET_EVENTS.MESSAGE_STATUS_UPDATE,
  //   ({ channelId, updates }) => {
  //     if (!updates || updates.length === 0) return;
  //     console.log(`Received status update for channel ${channelId}:`, updates);
  //     // Call Zustand action to update the specific messages
  //     updateMessageStatuses(channelId, updates);
  //   }
  // );

  socketInstance.on(
    SOCKET_EVENTS.MESSAGE_STATUS_UPDATE,
    ({ channelId, messageId, status, read_at, delivered_at }) => {
      console.log(`Received status update for message ${messageId}: ${status}`);
      // Update the specific message in the store
      updateExistingMessage(channelId, {
        id: messageId,
        read_at,
        delivered_at,
      }); // Pass updates
    }
  );

  // --- Listener for channel read confirmation ---
  socketInstance.on(
    SOCKET_EVENTS.CHANNEL_READ_UPDATE,
    ({ channelId, readAt, updatedMessageIds }) => {
      console.log(
        `Received channel read update for ${channelId}. ReadAt: ${readAt}, Updated IDs:`,
        updatedMessageIds
      );
      // Update the unread count locally
      updateUnreadCount(channelId, 0);
      // If backend provided updated IDs and timestamp, update message statuses
      if (readAt && updatedMessageIds && updatedMessageIds.length > 0) {
        const updates = updatedMessageIds.map((id) => ({
          messageId: id,
          read_at: readAt,
        }));
        updateMessageStatuses(channelId, updates);
      }
      // Note: If updatedMessageIds aren't provided, the client might need
      // to manually assume all its sent messages in the channel are read,
      // or refetch messages, which is less ideal.
    }
  );

  socketInstance.on(SOCKET_EVENTS.MESSAGE_UPDATED, ({ channelId, message }) => {
    console.log("Received message update:", message);
    updateExistingMessage(channelId, message);
  });

  socketInstance.on(
    SOCKET_EVENTS.MESSAGE_DELETED,
    ({ channelId, messageId }) => {
      console.log(`Received message delete for ID: ${messageId}`);
      removeMessage(channelId, messageId);
    }
  );

  // Add listeners for 'channelUpdated', 'channelDeleted', 'chatCleared' etc.
  // Example:
  // socketInstance.on('channelUpdated', ({ channelData }) => {
  //    updateChannelInList(channelData); // Need a function in chatStore for this
  // });

  socketInstance.on("channelMessagesRead", ({ channelId }) => {
    console.log(
      `Received confirmation: All messages read for channel ${channelId}`
    );
    // Update the unread count in the specific channel in the store
    updateUnreadCount(channelId, 0);
  });

  // Listener for general channel updates (e.g., after clearing chat, deleting chat)
  socketInstance.on("channelUpdated", ({ channelData }) => {
    console.log(`Received channel update for channel ${channelData.id}`);
    updateChannelInList(channelData); // Need this function in Zustand store
  });

  socketInstance.on("channelDeleted", ({ channelId }) => {
    console.log(`Received channel deletion for channel ${channelId}`);
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
    console.log(`Received chat cleared for channel ${channelId}`);
    const { clearMessagesForChannel } = useChatStore.getState(); // Need this function
    clearMessagesForChannel(channelId);
    toast.info("Chat history cleared.");
    // Also likely need to update the channel's latest_message preview
  });

  socketInstance.on("newChannelCreated", ({ channelData }) => {
    console.log("Received new channel created by another user:", channelData);
    // Add or update the channel in the list
    updateChannelInList(channelData);
    toast.info(`New chat started: ${channelData.name}`);
  });

  socketInstance.on("userOnline", ({ userId }) => {
    console.log(`User ${userId} came online`);
    updateChannelUserStatus(userId, true, null); // Set online, clear lastSeen
  });

  socketInstance.on("userOffline", ({ userId, lastSeen }) => {
    console.log(`User ${userId} went offline, last seen: ${lastSeen}`);
    updateChannelUserStatus(userId, false, lastSeen); // Set offline, update lastSeen
  });

  socketInstance.on(
    SOCKET_EVENTS.USER_TYPING,
    ({ channelId, userId, userName }) => {
      // Don't show typing indicator for yourself
      if (userId === currentUserId) return;

      console.log(
        `User ${userName} (${userId}) is typing in channel ${channelId}`
      );

      // Clear any existing timeout for this channel (prevents conflicts)
      clearTypingTimeoutRef(channelId);

      // Update store state
      setTypingUser(channelId, { userId, userName });

      // Set a local timeout to clear the indicator if stop event isn't received
      const timeoutId = setTimeout(() => {
        console.log(
          `Typing indicator timeout for channel ${channelId}, user ${userId}. Clearing.`
        );
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

      console.log(`User ${userId} stopped typing in channel ${channelId}`);

      // Clear the local timeout associated with this channel (if any)
      clearTypingTimeoutRef(channelId);

      // Clear the typing status in the store for this user/channel
      clearTypingUser(channelId, userId);
    }
  );

  console.log("Socket listeners configured.");
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
  console.log("Emitting getChannels");
  socket.emit(SOCKET_EVENTS.GET_CHANNELS, (response) => {
    console.log("getChannels response:", response);
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

  console.log(
    `Emitting getMessages for channel ${channelId}, page ${page}, limit ${limit}`
  );

  // Return a promise to allow the caller (ChatWindow) to know when it's done (optional)
  return new Promise((resolve, reject) => {
    socket.emit(
      SOCKET_EVENTS.GET_MESSAGES,
      { channelId, page, limit },
      (response) => {
        console.log(
          `getMessages response for channel ${channelId} page ${page}:`,
          response
        );
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
          console.log(
            "Message sent successfully via socket:",
            response.message
          );
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
          console.log("Message edited successfully:", response.message);
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
          console.log("Message deleted successfully");
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
  if (!socket || !socket.connected) return Promise.reject("Not connected");
  return new Promise((resolve, reject) => {
    socket.emit(
      SOCKET_EVENTS.MARK_MESSAGE_READ,
      { channelId, messageId },
      (response) => {
        if (response.success) {
          console.log(`Message ${messageId} marked as read.`);
          resolve();
        } else {
          // Don't necessarily show error toast for this, could fail silently or log
          console.warn(
            `Failed to mark message ${messageId} as read: ${response.error}`
          );
          reject(response.error);
        }
      }
    );
  });
};

export const emitMarkAllRead = (channelId) => {
  const socket = getSocket();
  if (!socket || !socket.connected) {
    const errorMsg = "Not connected";
    console.error("Socket not connected:", errorMsg);
    return Promise.reject(new Error(errorMsg));
  }
  console.log(`Emitting markChannelRead for channel ${channelId}`);
  return new Promise((resolve, reject) => {
    socket.emit("markChannelRead", { channelId }, (response) => {
      if (response?.success) {
        console.log(`Channel ${channelId} marked as read successfully.`);
        resolve();
      } else {
        const errorMsg = response?.error || "Failed on server";
        console.warn(
          `Failed to mark channel ${channelId} as read: ${errorMsg}`
        );
        reject(new Error(errorMsg));
      }
    });
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
  console.log(`Emitting clearChannelChat for channel ${channelId}`);
  // Return a promise to handle success/failure in the component
  return new Promise((resolve, reject) => {
    // Ensure the event name matches the one in node-server/socket/handlers.js
    socket.emit("clearChannelChat", { channelId }, (response) => {
      if (response?.success) {
        console.log(`Channel ${channelId} chat clear request successful.`);
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
  console.log(`Emitting deleteChannel for channel ${channelId}`);
  // Return a promise
  return new Promise((resolve, reject) => {
    // Ensure the event name matches the one in node-server/socket/handlers.js
    socket.emit("deleteChannel", { channelId }, (response) => {
      if (response?.success) {
        console.log(`Channel ${channelId} delete request successful.`);
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

  console.log(`Emitting createChannel with userIds: ${userIds}`);
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
          console.log("Channel creation/fetch successful:", response.channel);
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
    // console.log(`Emitting delivery ACK for msg ${messageId} in channel ${channelId}`); // Optional log
    socket.emit(SOCKET_EVENTS.MESSAGE_DELIVERED_ACK, { channelId, messageId });
  }
};

// Add emitters for other actions (markDelivered, channel operations...)
