import { io } from "socket.io-client";
import { create } from "zustand";
import { tokenService } from "./tokenService";

const SOCKET_URL = import.meta.env.VITE_KINTREE_SOCKET_URL;

class MessageService {
  constructor() {
    this.socket = null;
    this.socketUrl = SOCKET_URL;
  }

  setupHeartbeat() {
    this.socket.on("start-heartbeat", ({ interval }) => {
      // Clear existing interval if any
      if (this.heartbeatInterval) {
        clearInterval(this.heartbeatInterval);
      }

      // Start sending heartbeats
      this.heartbeatInterval = setInterval(() => {
        this.socket.emit("heartbeat");
      }, interval);
    });

    // Clear heartbeat on disconnect
    this.socket.on("disconnect", () => {
      if (this.heartbeatInterval) {
        clearInterval(this.heartbeatInterval);
        this.heartbeatInterval = null;
      }
    });
  }

  // Handle user status changes
  handleUserStatus() {
    this.socket.on("user-status-changed", ({ userId, isOnline }) => {
      // Update UI to reflect user's online status
      // console.log(`User ${userId} is ${isOnline ? "online" : "offline"}`);
    });
  }

  connect() {
    if (this.socket?.connected) return;

    const token = tokenService.getLoginToken();
    if (!token) {
      useMessageStore.getState().setError("No authentication token found");
      return;
    }

    const authToken = token.startsWith("Bearer ") ? token : `Bearer ${token}`;

    this.socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 3,
      autoConnect: true,
      reconnectionDelay: 1000,
      timeout: 10000,
      path: "/socket.io/",
      withCredentials: true,
      auth: { token: authToken },
      extraHeaders: {
        Authorization: authToken,
      },
      "Access-Control-Allow-Origin": "*",
    });

    // Setup heartbeat and status handlers first
    this.setupHeartbeat();
    this.handleUserStatus();

    this.setupSocketListeners();

    this.socket.on("connect_error", (error) => {
      useMessageStore.getState().setError("Socket connection error");
      // Fallback to polling if websocket fails
      if (error.type === "TransportError") {
        this.socket.io.opts.transports = ["polling"];
      }
    });

    // this.socket.on("reconnect", (attemptNumber) => {
    //   console.log("Reconnected after", attemptNumber, "attempts");
    //   useMessageStore.getState().setConnected(true);
    //   useMessageStore.getState().setError(null);

    //   // Rejoin current channel if any
    //   const currentChannel = useMessageStore.getState().currentChannel;
    //   if (currentChannel?.id) {
    //     this.joinChannel(currentChannel.id);
    //   }
    // });
  }

  disconnect() {
    if (this.socket) {
      // Clear heartbeat before disconnecting
      if (this.heartbeatInterval) {
        clearInterval(this.heartbeatInterval);
        this.heartbeatInterval = null;
      }

      this.socket.disconnect();
      this.socket = null;
      useMessageStore.getState().setConnected(false);
      useMessageStore.getState().clearMessages();
    }
  }

  setupSocketListeners() {
    if (!this.socket) return;

    this.socket.on("connect", () => {
      useMessageStore.getState().setConnected(true);
      useMessageStore.getState().setError(null);
      useMessageStore.getState().setChannelsLoading(true);
      this.socket.emit("get-channels", (response) => {
        if (response.success) {
          useMessageStore.getState().setChannels(response.channels);
        } else {
          console.error("Error fetching channels:", response.error);
        }
        useMessageStore.getState().setChannelsLoading(false);
      });
    });

    this.getFamilyMembers();

    this.socket.on("disconnect", (reason) => {
      useMessageStore.getState().setConnected(false);
    });

    this.socket.on("connect_error", (error) => {
      useMessageStore.getState().setError(error.message);
      useMessageStore.getState().setConnected(false);
    });

    this.socket.on("channel-delivered", (data) => {
      if (data.success) {
        const messages = useMessageStore.getState().messages;
        const updatedMessages = messages.map((msg) =>
          !msg.message_sent_by_me && !msg.delivered_at
            ? { ...msg, delivered_at: new Date().toISOString() }
            : msg
        );
        useMessageStore.getState().setMessages(updatedMessages);
      }
    });

    this.socket.on("channel-read", (data) => {
      if (data.success) {
        const messages = useMessageStore.getState().messages;
        const updatedMessages = messages.map((msg) =>
          !msg.message_sent_by_me && !msg.read_at
            ? { ...msg, read_at: new Date().toISOString() }
            : msg
        );
        useMessageStore.getState().setMessages(updatedMessages);
      }
    });

    // Channel events
    this.socket.on("channel-joined", (data) => {
      if (data.channel && data.messages) {
        useMessageStore.getState().setCurrentChannel(data.channel);
        useMessageStore.getState().setMessages(data.messages.data || []);
        useMessageStore.getState().setPagination(data.messages.pagination);
        useMessageStore.getState().setError(null);
      } else {
        useMessageStore.getState().setError("Invalid channel data received");
      }
      useMessageStore.getState().setLoading(false);
    });

    // Message events
    this.socket.on("message-sent", (response) => {
      if (response.success) {
        useMessageStore.getState().addMessage(response.data);
      }
    });

    this.socket.on("new-message", (message) => {
      const currentChannel = useMessageStore.getState().currentChannel;

      // Simply add the message if it's for the current channel
      if (parseInt(currentChannel?.id) === parseInt(message.channel_id)) {
        useMessageStore.getState().addMessage(message);

        // Mark as delivered if not sent by current user
        if (!message.message_sent_by_me) {
          this.markAsDelivered(message.channel_id, message.id);
          this.markAsRead(message.channel_id, message.id);
        }
      }

      // Update channels list with latest message
      this.updateChannelsList(message);
    });

    // Message status events
    this.socket.on("message-delivered", (data) => {
      useMessageStore.getState().updateMessageDeliveryStatus(data);
    });

    this.socket.on("message-read", (data) => {
      if (data.success) {
        const messages = useMessageStore.getState().messages;
        const updatedMessages = messages.map((msg) =>
          msg.id === data.messageId
            ? { ...msg, read_at: new Date().toISOString() }
            : msg
        );
        useMessageStore.getState().setMessages(updatedMessages);
      }
    });

    this.socket.on("messages-delivered", (data) => {
      if (data.channelId === useMessageStore.getState().currentChannel?.id) {
        const messages = useMessageStore.getState().messages;
        const updatedMessages = messages.map((msg) =>
          msg.message_sent_by_me && !msg.delivered_at
            ? { ...msg, delivered_at: new Date().toISOString() }
            : msg
        );
        useMessageStore.getState().setMessages(updatedMessages);
      }
    });

    this.socket.on("messages-read", (data) => {
      if (data.channelId === useMessageStore.getState().currentChannel?.id) {
        const messages = useMessageStore.getState().messages;
        const updatedMessages = messages.map((msg) =>
          msg.message_sent_by_me && !msg.read_at
            ? { ...msg, read_at: new Date().toISOString() }
            : msg
        );
        useMessageStore.getState().setMessages(updatedMessages);
      }
    });

    // Typing events
    this.socket.on("user-typing", (data) => {
      useMessageStore.getState().setUserTyping(data.userId);
    });

    this.socket.on("user-stopped-typing", (data) => {
      useMessageStore.getState().setUserStoppedTyping(data.userId);
    });

    // User presence events
    this.socket.on("user-joined", (data) => {
      useMessageStore.getState().addActiveUser(data);
    });

    this.socket.on("user-left", (data) => {
      useMessageStore.getState().removeActiveUser(data);
    });

    this.socket.on("channel-error", (data) => {
      useMessageStore.getState().setError(data.error);
      useMessageStore.getState().setLoading(false);
    });

    this.socket.on("messages-loaded", (data) => {
      try {
        // Check if we have the direct messages and pagination data
        if (data.messages && data.pagination) {
          useMessageStore
            .getState()
            .addMessages(data.messages, data.pagination);
        } else if (data.data?.messages && data.data?.pagination) {
          // Alternative format check
          useMessageStore
            .getState()
            .addMessages(data.data.messages, data.data.pagination);
        } else {
          useMessageStore.getState().setError("Invalid message data received");
        }
      } catch (error) {
        useMessageStore.getState().setError("Failed to process messages");
      } finally {
        useMessageStore.getState().setLoadingMore(false);
      }
    });

    this.socket.on("error", (error) => {
      useMessageStore.getState().setError(error?.message || "Connection error");
      useMessageStore.getState().setLoadingMore(false);
    });

    this.socket.on("message-deleted", (data) => {
      if (data.success) {
        useMessageStore.getState().removeMessage(data.messageId);
      }
    });

    this.socket.on("chat-cleared", (data) => {
      if (data.channelId === useMessageStore.getState().currentChannel?.id) {
        useMessageStore.getState().clearMessages();
      }
    });

    this.socket.on("messages-deleted", (data) => {
      if (data.channelId === useMessageStore.getState().currentChannel?.id) {
        useMessageStore.getState().removeMessages(data.messageIds);
      }
    });
    this.socket.on("user-left", (data) => {
      // Update channel members if needed
      const currentChannel = useMessageStore.getState().currentChannel;
      if (currentChannel?.id === data.channelId) {
        const updatedChannel = {
          ...currentChannel,
          users: currentChannel.users?.filter(
            (user) => user.id !== data.userId
          ),
        };
        useMessageStore.getState().setCurrentChannel(updatedChannel);
      }
    });
  }

  updateChannelsList(message) {
    const channels = useMessageStore.getState().channelsList;
    const currentChannel = useMessageStore.getState().currentChannel;

    const updatedChannels = channels.map((channel) => {
      if (parseInt(channel.id) === parseInt(message.channel_id)) {
        return {
          ...channel,
          latest_message: message,
          unread_message_count:
            parseInt(currentChannel?.id) !== parseInt(message.channel_id) &&
            !message.message_sent_by_me
              ? (channel.unread_message_count || 0) + 1
              : channel.unread_message_count,
        };
      }
      return channel;
    });

    useMessageStore.getState().setChannels(updatedChannels);
  }

  createChannel(channelData) {
    if (!this.socket?.connected) {
      return Promise.reject(new Error("Socket not connected"));
    }

    return new Promise((resolve, reject) => {
      this.socket.emit("create-channel", channelData, (response) => {
        if (response.success) {
          useMessageStore.getState().setChannels(response.channels);

          // Find the newly created channel with updated logic
          const newChannel = response.channels.find((channel) => {
            if (channelData instanceof FormData) {
              // For group chats
              return channel.name === channelData.get("name");
            } else {
              // For direct messages - match by user_id
              return (
                channelData.user_ids &&
                channel.user_id === channelData.user_ids[0]
              );
            }
          });

          if (newChannel) {
            // Set as current channel in the store
            useMessageStore.getState().setCurrentChannel(newChannel);
            // Join the new channel immediately
            this.joinChannel(newChannel.id, 1);
          }

          resolve({ ...response, newChannel });
        } else {
          useMessageStore.getState().setError(response.error);
          reject(new Error(response.error || "Failed to create channel"));
        }
      });
    });
  }

  updateChannel(channelId, updateData) {
    if (!this.socket?.connected) {
      return Promise.reject(new Error("Socket not connected"));
    }

    // Convert FormData to a plain object
    const data = {};
    for (let [key, value] of updateData.entries()) {
      data[key] = value;
    }

    return new Promise((resolve, reject) => {
      this.socket.emit("update-channel", { channelId, data }, (response) => {
        if (response.success) {
          useMessageStore.getState().setChannels(response.channels);
          resolve(response);
        } else {
          useMessageStore.getState().setError(response.error);
          reject(new Error(response.error || "Failed to update channel"));
        }
      });
    });
  }

  createGroup(groupData) {
    if (!this.socket?.connected) {
      return Promise.reject(new Error("Socket not connected"));
    }
    return new Promise((resolve, reject) => {
      this.socket.emit("create-group", groupData, (response) => {
        if (response.success) {
          useMessageStore.getState().setChannels(response.channels);
          resolve(response);
        } else {
          useMessageStore.getState().setError(response.error);
          reject(new Error(response.error || "Failed to create group"));
        }
      });
    });
  }

  updateGroup(channelId, updateData) {
    if (!this.socket?.connected) {
      return Promise.reject(new Error("Socket not connected"));
    }
    return new Promise((resolve, reject) => {
      this.socket.emit(
        "update-group",
        { channelId, data: updateData },
        (response) => {
          if (response.success) {
            useMessageStore.getState().setChannels(response.channels);
            resolve(response);
          } else {
            useMessageStore.getState().setError(response.error);
            reject(new Error(response.error || "Failed to update group"));
          }
        }
      );
    });
  }

  deleteGroup(channelId) {
    if (!this.socket?.connected) {
      return Promise.reject(new Error("Socket not connected"));
    }
    return new Promise((resolve, reject) => {
      this.socket.emit("delete-group", channelId, (response) => {
        if (response.success) {
          useMessageStore.getState().setChannels(response.channels);
          resolve(response);
        } else {
          useMessageStore.getState().setError(response.error);
          reject(new Error(response.error || "Failed to delete group"));
        }
      });
    });
  }

  async switchToChannel(channel) {
    try {
      if (!channel?.id) {
        throw new Error("Invalid channel");
      }

      // Update current channel in store
      useMessageStore.getState().setCurrentChannel(channel);

      // Leave current channel if any
      const currentChannel = useMessageStore.getState().currentChannel;
      if (currentChannel && currentChannel.id !== channel.id) {
        this.leaveChannel(currentChannel.id);
      }

      // Join new channel
      await this.joinChannel(channel.id, 1);

      return true;
    } catch (error) {
      useMessageStore.getState().setError(error.message);
      return false;
    }
  }

  joinChannel(channelId, page = 1) {
    if (!channelId || isNaN(parseInt(channelId))) {
      useMessageStore.getState().setError("Invalid channel ID");
      return;
    }

    if (!this.socket?.connected) {
      this.connect();
    }

    useMessageStore.getState().setLoading(true);
    useMessageStore.getState().setError(null);
    useMessageStore.getState().clearMessages(); // Clear existing messages

    this.socket.emit(
      "join-channel",
      {
        channelId: parseInt(channelId),
        page,
        limit: 20,
      },
      (response) => {
        if (!response.success) {
          useMessageStore.getState().setError(response.error);
          useMessageStore.getState().setLoading(false);
        }
      }
    );

    // Mark as delivered and read after joining
    this.markChannelAsDelivered(channelId);
    this.markChannelAsRead(channelId);
  }

  markChannelAsDelivered(channelId) {
    if (!this.socket?.connected) return;

    this.socket.emit(
      "mark-channel-delivered",
      {
        channelId: parseInt(channelId),
      },
      (response) => {
        if (!response.success) {
          console.error("Failed to mark channel as delivered:", response.error);
        }
      }
    );
  }

  getFamilyMembers() {
    this.socket.emit("get-family-members", (response) => {
      useMessageStore.getState().setFamilyMembersLoading(true);
      if (response.success) {
        useMessageStore.getState().setFamilyMembers(response.family_members);
      } else {
        console.error("Error fetching family members:", response.error);
      }
      useMessageStore.getState().setFamilyMembersLoading(false);
    });
  }

  markChannelAsRead(channelId) {
    if (!this.socket?.connected) return;

    this.socket.emit(
      "mark-channel-read",
      {
        channelId: parseInt(channelId),
      },
      (response) => {
        if (!response.success) {
          console.error("Failed to mark channel as read:", response.error);
        }
      }
    );
  }

  async leaveChannel(channelId) {
    if (!this.socket?.connected) {
      throw new Error("Socket not connected");
    }

    try {
      return new Promise((resolve, reject) => {
        this.socket.emit("leave-channel", { channelId }, (response) => {
          if (response.success) {
            const currentChannels = useMessageStore.getState().channelsList;
            const updatedChannels = currentChannels.filter(
              (channel) => channel.id !== channelId
            );
            useMessageStore.getState().setChannels(updatedChannels);
            useMessageStore.getState().setCurrentChannel(null);
            useMessageStore.getState().clearMessages();
            resolve(response);
          } else {
            reject(new Error(response.error || "Failed to leave channel"));
          }
        });
      });
    } catch (error) {
      useMessageStore.getState().setError("Failed to leave channel");
      throw error;
    }
  }

  // Message methods
  async sendMessage(channelId, message, attachment = null) {
    if (!this.socket?.connected) return false;

    try {
      useMessageStore.getState().setSending(true);

      // If there's an attachment, convert it to base64
      let attachmentData = null;
      if (attachment) {
        // Validate file type
        const allowedTypes = [".jpg", ".jpeg", ".png", ".gif", ".svg"];
        const fileExt = attachment.name
          .substring(attachment.name.lastIndexOf("."))
          .toLowerCase();

        if (!allowedTypes.includes(fileExt)) {
          throw new Error(
            `Invalid file type. Allowed types: ${allowedTypes.join(", ")}`
          );
        }

        // Convert file to base64
        const reader = new FileReader();
        attachmentData = await new Promise((resolve, reject) => {
          reader.onload = () =>
            resolve({
              data: reader.result,
              name: attachment.name,
              type: attachment.type,
            });
          reader.onerror = reject;
          reader.readAsDataURL(attachment);
        });
      }

      return new Promise((resolve, reject) => {
        this.socket.emit(
          "send-message",
          {
            channelId,
            message,
            attachment: attachmentData,
          },
          (response) => {
            if (response.success) {
              useMessageStore.getState().addMessage(response.data);
              resolve(response);
            } else {
              reject(new Error(response.error));
            }
          }
        );
      });
    } catch (error) {
      useMessageStore
        .getState()
        .setError(error.message || "Failed to send message");
      return false;
    } finally {
      useMessageStore.getState().setSending(false);
    }
  }

  // Message status methods
  markAsDelivered(channelId, messageId) {
    if (this.socket?.connected) {
      this.socket.emit("mark-delivered", { channelId, messageId });
    }
  }

  markAsRead(channelId, messageId) {
    if (!this.socket?.connected) return;

    this.socket.emit("mark-as-read", {
      channelId: parseInt(channelId),
      messageId: parseInt(messageId),
    });
  }

  // Typing methods
  startTyping(channelId) {
    if (this.socket?.connected) {
      this.socket.emit("typing-start", { channelId });
    }
  }

  stopTyping(channelId) {
    if (this.socket?.connected) {
      this.socket.emit("typing-stop", { channelId });
    }
  }

  // Message update/delete methods
  async updateMessage(channelId, messageId, message) {
    if (!this.socket?.connected) {
      throw new Error("Socket not connected");
    }

    try {
      useMessageStore.getState().setSending(true);

      return new Promise((resolve, reject) => {
        this.socket.emit(
          "update-message",
          { channelId, messageId, message },
          (response) => {
            if (response.error) {
              reject(new Error(response.error));
            } else {
              useMessageStore.getState().updateMessage(response);
              resolve(response);
            }
          }
        );
      });
    } catch (error) {
      useMessageStore.getState().setError("Failed to update message");
      throw error;
    } finally {
      useMessageStore.getState().setSending(false);
    }
  }

  async clearChat(channelId, messageIds = []) {
    if (!this.socket?.connected) {
      throw new Error("Socket not connected");
    }

    try {
      return new Promise((resolve, reject) => {
        const payload = {
          channelId: parseInt(channelId),
          message_ids: messageIds,
        };
        this.socket.emit("clear-chat", payload, (response) => {
          if (response.success) {
            // Handle specific messages deletion
            if (messageIds.length > 0) {
              useMessageStore.getState().removeMessages(messageIds);
            }
            // Handle complete chat clearing
            else {
              useMessageStore.getState().setMessages([]);
            }

            this.socket.emit("get-channels", (channelsResponse) => {
              if (channelsResponse.success) {
                useMessageStore
                  .getState()
                  .setChannels(channelsResponse.channels);
              }
            });
            resolve(response);
          } else {
            reject(new Error(response.error || "Failed to clear chat"));
          }
        });
      });
    } catch (error) {
      useMessageStore.getState().setError("Failed to clear chat");
      throw error;
    }
  }

  async deleteMessage(channelId, messageId) {
    if (!this.socket?.connected) {
      throw new Error("Socket not connected");
    }

    try {
      return new Promise((resolve, reject) => {
        this.socket.emit(
          "delete-message",
          {
            channelId: parseInt(channelId),
            messageId: parseInt(messageId),
          },
          (response) => {
            if (response.success) {
              useMessageStore.getState().removeMessage(messageId);
              resolve(response);
            } else {
              reject(new Error(response.error || "Failed to delete message"));
            }
          }
        );
      });
    } catch (error) {
      useMessageStore.getState().setError("Failed to delete message");
      throw error;
    }
  }

  loadMoreMessages(channelId, page) {
    if (!this.socket?.connected) {
      useMessageStore.getState().setError("Socket not connected");
      return;
    }

    useMessageStore.getState().setLoadingMore(true);

    this.socket.emit("load-more-messages", {
      channelId: parseInt(channelId),
      page,
      limit: 20,
    });
  }

  deleteChannel(channelId) {
    if (!this.socket?.connected) return Promise.reject("Socket not connected");

    return new Promise((resolve, reject) => {
      this.socket.emit("delete-channel", { channelId }, (response) => {
        if (response.success) {
          resolve(response);
        } else {
          reject(response.error || "Failed to delete channel");
        }
      });
    });
  }
}

// Zustand store
export const useMessageStore = create((set) => ({
  currentChannel: null,
  channelsLoading: false,
  channelsList: [],
  familyMembersLoading: false,
  familyMembers: [],
  messages: [],
  isConnected: false,
  isLoading: false,
  isSending: false,
  isLoadingMore: false,
  error: null,
  activeUsers: new Set(),
  pagination: {
    currentPage: 1,
    lastPage: 1,
    totalRecords: 0,
    filteredRecords: 0,
  },
  typingUsers: new Set(),
  onlineUsers: new Set(),
  addOnlineUser: (userId) =>
    set((state) => ({
      onlineUsers: new Set([...state.onlineUsers, userId]),
    })),

  removeOnlineUser: (userId) =>
    set((state) => ({
      onlineUsers: new Set(
        [...state.onlineUsers].filter((id) => id !== userId)
      ),
    })),

  isUserOnline: (userId) => set((state) => state.onlineUsers.has(userId)),
  setFamilyMembers: (familyMembers) => set({ familyMembers: familyMembers }),
  setFamilyMembersLoading: (loading) => set({ familyMembersLoading: loading }),
  setChannels: (channels) => set({ channelsList: channels }),
  setChannelsLoading: (loading) => set({ channelsLoading: loading }),
  setCurrentChannel: (channel) =>
    set((state) => ({
      currentChannel: channel
        ? {
            ...channel,
            created_at: channel.created_at,
            description: channel.description,
            id: channel.id,
            is_group: channel.is_group,
            is_online: channel.is_online,
            latest_message: channel.latest_message,
            name: channel.name,
            thumbnail_image_url: channel.thumbnail_image_url,
            unread_message_count: channel.unread_message_count,
            user_id: channel.user_id,
          }
        : null,
    })),
  updateChannelData: (channelId, data) =>
    set((state) => ({
      channelsList: state.channelsList.map((channel) =>
        channel.id === channelId ? { ...channel, ...data } : channel
      ),
      currentChannel:
        state.currentChannel?.id === channelId
          ? { ...state.currentChannel, ...data }
          : state.currentChannel,
    })),
  setConnected: (isConnected) => set({ isConnected }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) =>
    set((state) => ({
      error: error,
      isLoadingMore: false, // Ensure loading state is reset on error
    })),
  setSending: (isSending) => set({ isSending }),

  setMessages: (messages) => set({ messages }),
  setPagination: (pagination) =>
    set({
      pagination: {
        currentPage: pagination.currentPage,
        lastPage: pagination.lastPage,
        totalRecords: pagination.totalRecords,
        filteredRecords: pagination.filteredRecords,
      },
    }),

  addMessage: (message) =>
    set((state) => {
      // Ensure channel IDs match and convert to numbers for comparison
      if (parseInt(state.currentChannel?.id) !== parseInt(message.channel_id)) {
        return state;
      }

      // Check for duplicates
      const messageExists = state.messages.some((msg) => msg.id === message.id);
      if (messageExists) {
        return state;
      }

      // Sort messages by timestamp
      const updatedMessages = [...state.messages, message].sort(
        (a, b) => new Date(a.created_at) - new Date(b.created_at)
      );

      return {
        messages: updatedMessages,
      };
    }),

  removeMessage: (messageId) =>
    set((state) => ({
      messages: state.messages.filter((msg) => msg.id !== messageId),
    })),
  removeMessages: (messageIds) =>
    set((state) => ({
      messages: state.messages.filter((msg) => !messageIds.includes(msg.id)),
    })),

  updateMessage: (updatedMessage) =>
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === updatedMessage.id ? updatedMessage : msg
      ),
    })),

  updateMessageDeliveryStatus: (data) =>
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === data.messageId
          ? { ...msg, delivered_at: data.deliveredAt }
          : msg
      ),
    })),

  updateMessageReadStatus: (data) =>
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === data.messageId ? { ...msg, read_at: data.readAt } : msg
      ),
    })),

  addActiveUser: (userData) =>
    set((state) => ({
      activeUsers: new Set([...state.activeUsers, userData.userId]),
    })),

  removeActiveUser: (userData) =>
    set((state) => ({
      activeUsers: new Set(
        [...state.activeUsers].filter((id) => id !== userData.userId)
      ),
    })),

  setUserTyping: (userId) => {
    set((state) => ({
      typingUsers: new Set([...state.typingUsers, userId]),
    }));
  },

  setUserStoppedTyping: (userId) =>
    set((state) => ({
      typingUsers: new Set(
        [...state.typingUsers].filter((id) => id !== userId)
      ),
    })),

  clearMessages: () =>
    set({
      messages: [],
      // currentChannel: null,
      pagination: {
        currentPage: 1,
        lastPage: 1,
        totalRecords: 0,
        filteredRecords: 0,
      },
      typingUsers: new Set(),
    }),

  addMessages: (newMessages, pagination) =>
    set((state) => {
      try {
        // Ensure we have valid arrays
        const currentMessages = Array.isArray(state.messages)
          ? state.messages
          : [];
        const incomingMessages = Array.isArray(newMessages) ? newMessages : [];

        // For subsequent pages, prepend messages (since older messages are coming in)
        return {
          messages: [...incomingMessages, ...currentMessages],
          pagination: {
            currentPage:
              pagination?.currentPage || state.pagination.currentPage,
            lastPage: pagination?.lastPage || state.pagination.lastPage,
            totalRecords:
              pagination?.totalRecords || state.pagination.totalRecords,
            filteredRecords:
              pagination?.filteredRecords || state.pagination.filteredRecords,
          },
        };
      } catch (error) {
        return state; // Return unchanged state on error
      }
    }),

  setLoadingMore: (isLoadingMore) => set({ isLoadingMore }),
}));

export const messageService = new MessageService();
