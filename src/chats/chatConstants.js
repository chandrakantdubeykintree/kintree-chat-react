// frontend/src/chats/chatConstants.js
export const SOCKET_EVENTS = {
  CONNECT: "connect",
  DISCONNECT: "disconnect",
  CONNECT_ERROR: "connect_error",

  // Client -> Server
  GET_CHANNELS: "getChannels",
  GET_MESSAGES: "getMessages",
  SEND_MESSAGE: "sendMessage",
  EDIT_MESSAGE: "editMessage",
  DELETE_MESSAGE: "deleteMessage",
  MARK_MESSAGE_READ: "markMessageRead",
  // Add other client events...

  // Server -> Client
  NEW_MESSAGE: "newMessage",
  MESSAGE_UPDATED: "messageUpdated",
  MESSAGE_DELETED: "messageDeleted",
  MESSAGE_STATUS_UPDATE: "messageStatusUpdate",
  // Add other server events...

  START_TYPING: "startTyping", // Client -> Server
  STOP_TYPING: "stopTyping", // Client -> Server
  USER_TYPING: "userTyping", // Server -> Client
  USER_STOPPED_TYPING: "userStoppedTyping", // Server -> Client

  MESSAGE_DELIVERED_ACK: "messageDeliveredAck", // Client -> Server (Client confirms receipt)
  MARK_CHANNEL_READ: "markChannelRead", // Client -> Server (Already exists)
  CHANNEL_READ_UPDATE: "channelReadUpdate", // Server -> Client (Confirms channel read, maybe provides updated messages)
};

// Could also add API endpoints here if hitting Node HTTP endpoints directly
export const NODE_SERVER_URL =
  import.meta.env.VITE_NODE_SERVER_URL || "http://localhost:3001"; // Get from .env
