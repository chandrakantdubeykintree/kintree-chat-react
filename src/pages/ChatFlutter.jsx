import { Card } from "@/components/ui/card";
import { useEffect, useState, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  MoreVertical,
  Check,
  CheckCheck,
  Send,
  X,
  UserPlus,
  Search,
  PlusIcon,
  Camera,
  ImageIcon,
  File,
  Pencil,
  CircleUserRound,
  Trash2Icon,
  Users,
} from "lucide-react";

import { Label } from "@/components/ui/label";

import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { messageService, useMessageStore } from "@/services/messageService";
import { format } from "date-fns";
import { Checkbox } from "@/components/ui/checkbox";
import AsyncComponent from "@/components/async-component";
import ComponentLoading from "@/components/component-loading";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { kintreeApi } from "@/services/kintreeApi";
import TypingIndicator from "@/components/typing-indicator";
import { useNavigate, useSearchParams } from "react-router";

// Define validation schema
const editChannelSchema = z.object({
  name: z
    .string()
    .min(1, "Group name is required")
    .max(50, "Group name must be less than 50 characters"),
  description: z
    .string()
    .max(100, "Description must be less than 100 characters")
    .optional(),
  thumbnail_image: z.any().optional(),
});

export default function ChatFlutter({ isFlutter, onViewChange }) {
  const [selectedChannel, setSelectedChannel] = useState(null);
  const navigate = useNavigate();
  const [openSheet, setOpenSheet] = useState({
    createChannel: false,
    updateChannel: false,
    deleteChannel: false,
    channelInfo: false,
    clearChat: false,
    messageInfo: false,
    deleteMessage: false,
  });
  const [newMessage, setNewMessage] = useState("");
  const [showMobileList, setShowMobileList] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isMembersDialogOpen, setIsMembersDialogOpen] = useState(false);
  const [newChannelData, setNewChannelData] = useState({
    name: "",
    description: "",
    thumbnail_image: null,
    selectedUserId: null,
  });
  const messagesEndRef = useRef(null);
  const [sendStatus, setSendStatus] = useState(null);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [isInfoDialogOpen, setIsInfoDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState(null);
  const [isGroupChatMode, setIsGroupChatMode] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [channelSearchQuery, setChannelSearchQuery] = useState("");
  const [memberSearchQuery, setMemberSearchQuery] = useState("");
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState([]);
  const [messageInfoData, setMessageInfoData] = useState(null);
  const [attachment, setAttachment] = useState(null);
  const [longPressTimer, setLongPressTimer] = useState(null);
  const [isTouchActive, setIsTouchActive] = useState(false);
  const {
    messages,
    channelsLoading,
    familyMembers,
    familyMembersLoading,
    channelsList,
    isConnected,
    isLoading: messagesLoading,
    isLoadingMore,
    isSending,
    pagination,
    error: socketError,
  } = useMessageStore();

  // const [searchParams, setSearchParams] = useSearchParams();
  // useEffect(() => {
  //   if (isFlutter) {
  //     setSearchParams({ mobile: showMobileList ? "true" : "false" });
  //   }
  // }, [showMobileList, isFlutter, setSearchParams]);
  const handleShowMobileList = (show) => {
    setShowMobileList(show);
    // if (isFlutter && onViewChange) {
    //   onViewChange(show);
    // }
    if (show) {
      setSelectedChannel(null);
    }
  };

  // const [newMembersToAdd, setNewMembersToAdd] = useState([]);
  // const handleUpdateGroupMembers = (member) => {
  //   setNewMembersToAdd((prev) =>
  //     prev.some((m) => m.id === member.id)
  //       ? prev.filter((m) => m.id !== member.id)
  //       : [...prev, member]
  //   );
  // };

  const handleTouchStart = (messageId) => {
    setIsTouchActive(true);
    const timer = setTimeout(() => {
      setIsSelectMode(true);
      setSelectedMessages([messageId]);
    }, 300);
    setLongPressTimer(timer);
  };

  const handleTouchEnd = () => {
    setIsTouchActive(false);
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  const {
    control,
    handleSubmit,
    reset,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(editChannelSchema),
    defaultValues: {
      name: newChannelData.name,
      description: newChannelData.description,
      thumbnail_image: null,
    },
  });

  useEffect(() => {
    if (openSheet.updateChannel && selectedChannel) {
      const currentValues = {
        name: selectedChannel.name,
        description: selectedChannel.description || "",
        thumbnail_image: null,
      };

      if (JSON.stringify(currentValues) !== JSON.stringify(getValues())) {
        reset(currentValues);
        setNewChannelData({
          name: selectedChannel.name,
          description: selectedChannel.description || "",
          thumbnail_image: null,
          channelId: selectedChannel.id,
        });
      }
    }
  }, [openSheet.updateChannel, selectedChannel]);

  const handleUpdateSubmit = async (data) => {
    try {
      const formData = new FormData();

      // Always include the channel ID
      formData.append("channelId", newChannelData.channelId);
      formData.append("is_group", 1);

      // Add name if it's provided
      if (data.name) {
        formData.append("name", data.name);
      }

      // Add description (even if empty)
      formData.append("description", data.description || "");
      formData.append("_method", "PUT");

      // Add thumbnail image if it's provided
      if (data.thumbnail_image) {
        formData.append("thumbnail_image", data.thumbnail_image);
      } else if (!selectedChannel?.thumbnail_image_url) {
        // If no image was set before and no new image is provided, send null
        formData.append("thumbnail_image", null);
      }

      await messageService.updateChannel(newChannelData.channelId, formData);

      toast.success("Channel updated successfully");
      setOpenSheet((prev) => ({ ...prev, updateChannel: false }));
    } catch (error) {
      toast.error("Failed to update channel: " + error.message);
    }
  };

  // Add this function to handle file selection
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size should not exceed 5MB");
      return;
    }

    // Validate file type
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/svg+xml",
    ];
    if (!allowedTypes.includes(file.type)) {
      toast.error(
        `Invalid file type. Allowed types: ${allowedTypes.join(", ")}`
      );
      return;
    }

    // Set the file as an attachment
    setAttachment(file);
  };
  const handleCameraClick = () => {
    if (isFlutter && window.callbackHandler) {
      window.callbackHandler.postMessage(
        JSON.stringify({
          type: "openFilePicker",
        })
      );
    } else {
      document.getElementById("attachment").click();
    }
  };
  // const handleMobileBack = () => {
  //   if (isFlutter && window.callbackHandler) {
  //     window.callbackHandler.postMessage(
  //       JSON.stringify({
  //         type: "leaveChatPage",
  //       })
  //     );
  //   }
  // };

  // useEffect(() => {
  //   window.handleFileSelect = function (fileName, fileExtension, base64File) {
  //     const fileType = `image/${fileExtension}`;
  //     const byteCharacters = atob(base64File);
  //     const byteNumbers = new Array(byteCharacters.length);
  //     for (let i = 0; i < byteCharacters.length; i++) {
  //       byteNumbers[i] = byteCharacters.charCodeAt(i);
  //     }
  //     const byteArray = new Uint8Array(byteNumbers);
  //     const file = new File([byteArray], fileName, { type: fileType });

  //     // Validate file size (5MB limit)
  //     if (file.size > 5 * 1024 * 1024) {
  //       toast.error("File size should not exceed 5MB");
  //       return;
  //     }

  //     // Validate file type
  //     const allowedTypes = [
  //       "image/jpeg",
  //       "image/png",
  //       "image/gif",
  //       "image/svg+xml",
  //     ];
  //     if (!allowedTypes.includes(file.type)) {
  //       toast.error(
  //         `Invalid file type. Allowed types: ${allowedTypes.join(", ")}`
  //       );
  //       return;
  //     }

  //     setAttachment(file);
  //   };
  //   return () => {
  //     delete window.handleFileSelect;
  //   };
  // }, []);

  // useEffect(() => {
  //   window.handleFileSelect = function (fileUrl) {
  //     // Fetch the file from the URL
  //     fetch(fileUrl)
  //       .then((response) => {
  //         if (!response.ok) {
  //           throw new Error(`HTTP error! Status: ${response.status}`);
  //         }
  //         return response.blob();
  //       })
  //       .then((blob) => {
  //         console.log("File fetched successfully:", blob);

  //         // Create a File object from the blob
  //         const file = new File([blob], "image.jpg", { type: blob.type });

  //         // Validate file size (5MB limit)
  //         if (file.size > 5 * 1024 * 1024) {
  //           toast.error("File size should not exceed 5MB");
  //           return;
  //         }

  //         // Validate file type
  //         const allowedTypes = [
  //           "image/jpeg",
  //           "image/png",
  //           "image/gif",
  //           "image/svg+xml",
  //         ];
  //         if (!allowedTypes.includes(file.type)) {
  //           toast.error(
  //             `Invalid file type. Allowed types: ${allowedTypes.join(", ")}`
  //           );
  //           return;
  //         }

  //         // Set the file as an attachment
  //         setAttachment(file);
  //       })
  //       .catch((error) => {
  //         console.error("Error fetching file:", error);
  //         toast.error("Failed to load file");
  //       });
  //   };

  //   return () => {
  //     delete window.handleFileSelect;
  //   };
  // }, []);

  useEffect(() => {
    window.handleBackButtonPress = () => {
      // First check if any sheet is open and close it

      // Close all sheets
      setOpenSheet({
        createChannel: false,
        updateChannel: false,
        deleteChannel: false,
        channelInfo: false,
        clearChat: false,
        messageInfo: false,
        deleteMessage: false,
      });
      setIsInfoDialogOpen(false);
      setIsDeleteDialogOpen(false);
      setMessageToDelete(null);
      setIsMembersDialogOpen(false);
      setIsCreateDialogOpen(false);
      setMessageInfoData(null);

      // If no sheets are open, handle the back navigation
      handleBack();
      return () => {
        delete window.handleBackButtonPress;
      };
    };
  }, []);

  useEffect(() => {
    window.handleFileSelect = function (dataUrl) {
      console.log("Data URL received:", dataUrl);

      // Validate the data URL
      if (
        !dataUrl ||
        typeof dataUrl !== "string" ||
        !dataUrl.startsWith("data:")
      ) {
        toast.error("Invalid file data");
        return;
      }

      // Convert the data URL to a File object
      fetch(dataUrl)
        .then((response) => response.blob())
        .then((blob) => {
          console.log("File fetched successfully:", blob);

          // Create a File object from the blob
          const file = new File([blob], "image.jpg", { type: blob.type });

          // Validate file size (5MB limit)
          if (file.size > 5 * 1024 * 1024) {
            toast.error("File size should not exceed 5MB");
            return;
          }

          // Validate file type
          const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/gif",
            "image/svg+xml",
          ];
          if (!allowedTypes.includes(file.type)) {
            toast.error(
              `Invalid file type. Allowed types: ${allowedTypes.join(", ")}`
            );
            return;
          }

          // Set the file as an attachment
          setAttachment(file);
          toast.success("File loaded successfully");
        })
        .catch((error) => {
          console.error("Error fetching file:", error);
          toast.error("Failed to load file: " + error.message);
        });
    };

    return () => {
      delete window.handleFileSelect;
    };
  }, []);

  // Add this function to handle message selection
  const handleMessageSelect = (messageId) => {
    setSelectedMessages((prev) =>
      prev.includes(messageId)
        ? prev.filter((id) => id !== messageId)
        : [...prev, messageId]
    );
  };

  // Initialize socket connection
  useEffect(() => {
    if (!messageService.socket?.connected) {
      messageService.connect();
    }

    return () => {
      // if (selectedChannel) {
      //   messageService.leaveChannel(selectedChannel.id);
      // }
      messageService.disconnect();
    };
  }, []);
  useEffect(() => {
    return () => {
      // Only attempt to leave if there's a selected channel when component unmounts
      if (selectedChannel?.id) {
        messageService.leaveChannel(selectedChannel.id);
      }
    };
  }, [selectedChannel?.id]);

  // Scroll to bottom for new messages
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Auto scroll to bottom when new messages arrive (not for loading more)
  useEffect(() => {
    if (!isLoadingMore) {
      scrollToBottom();
    }
  }, [messages, isLoadingMore, scrollToBottom]);

  // Maintain scroll position when loading older messages
  useEffect(() => {
    if (isLoadingMore) {
      const messagesContainer = document.querySelector(".messages-container");
      if (messagesContainer) {
        const scrollHeight = messagesContainer.scrollHeight;
        messagesContainer.scrollTop = scrollHeight;
      }
    }
  }, [messages, isLoadingMore]);

  // Handle message delivery status
  useEffect(() => {
    if (!selectedChannel || !messages.length) return;

    // Mark all unread messages as read when channel is opened
    const unreadMessages = messages.filter(
      (msg) => !msg.message_sent_by_me && !msg.read_at
    );

    if (unreadMessages.length > 0) {
      unreadMessages.forEach((msg) => {
        messageService.markAsRead(selectedChannel.id, msg.id);
      });
    }
  }, [selectedChannel, messages]);

  const handleMemberSelect = async (member) => {
    if (isGroupChatMode) {
      setSelectedMembers((prev) =>
        prev.some((m) => m.id === member.id)
          ? prev.filter((m) => m.id !== member.id)
          : [...prev, member]
      );
    } else {
      setIsMembersDialogOpen(false);
      try {
        const channelData = {
          is_group: 0,
          name: `${member.first_name} ${member.last_name}`,
          description: null,
          thumbnail_image: null,
          user_ids: [member.id],
        };

        const response = await messageService.createChannel(channelData);

        if (response.newChannel) {
          setSelectedChannel(response.newChannel);
          setShowMobileList(false);
          setOpenSheet((prev) => ({ ...prev, createChannel: false }));
        }

        toast.success("Chat created successfully");
      } catch (error) {
        toast.error("Failed to create channel: " + error.message);
      }
    }
  };

  const updateOnlineStatus = async (isOnline) => {
    try {
      if (selectedChannel) {
        setSelectedChannel((prev) => ({
          ...prev,
          is_online: isOnline,
        }));
      }
      await kintreeApi.put("/user/change-online-status", {
        is_online: isOnline,
      });
    } catch (error) {
      console.error("Failed to update online status:", error);
    }
  };

  // Update the socket connection useEffect
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        updateOnlineStatus(true);
      } else {
        updateOnlineStatus(false);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Initial status update
    updateOnlineStatus(true);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      updateOnlineStatus(false);
    };
  }, []);

  const handleCreateGroupChat = async (e) => {
    e.preventDefault();
    if (selectedMembers.length < 2) return;

    try {
      const formData = new FormData();

      formData.append("is_group", 1);

      // Add name if it's provided
      if (newChannelData.name) {
        formData.append("name", newChannelData.name);
      }

      // Add description (even if empty)
      formData.append("description", newChannelData.description || "");

      // Add thumbnail image if it's provided
      if (newChannelData.thumbnail_image) {
        formData.append("thumbnail_image", newChannelData.thumbnail_image);
      } else {
        // If no image was set before and no new image is provided, send null
        formData.append("thumbnail_image", null);
      }

      selectedMembers.forEach((member) => {
        formData.append("user_ids[]", member.id);
      });

      const response = await messageService.createChannel(formData);

      if (response.newChannel) {
        setSelectedChannel(response.newChannel);
        setShowMobileList(false);
      }

      setIsCreateDialogOpen(false);
      setIsMembersDialogOpen(false);
      setSelectedMembers([]);
      setNewChannelData({
        name: "",
        description: "",
        thumbnail_image: null,
      });
      setIsGroupChatMode(false);
      setOpenSheet((prev) => ({
        ...prev,
        createChannel: false,
      }));

      toast.success("Group created successfully");
    } catch (error) {
      console.error("Failed to create group channel:", error);
      toast.error("Failed to create group channel: " + error.message);
    }
  };

  const handleClearChat = async () => {
    try {
      if (!selectedChannel?.id) return;

      // For deleting selected messages
      if (selectedMessages.length > 0) {
        await messageService.clearChat(selectedChannel.id, selectedMessages);
        setSelectedMessages([]);
        setIsSelectMode(false);
      }
      // For clearing entire chat
      else {
        await messageService.clearChat(selectedChannel.id);
      }

      setIsDeleteDialogOpen(false);
      toast.success("Messages cleared successfully");
    } catch (error) {
      console.error("Clear chat error:", error);
      toast.error(error.message || "Failed to clear messages");
    }
  };

  const handleChannelSelect = async (channel) => {
    if (selectedChannel?.id === channel.id) return;

    setAttachment(null);

    if (selectedChannel) {
      messageService.leaveChannel(selectedChannel.id);
    }

    setSelectedChannel(channel);
    setShowMobileList(false);
    setIsSelectMode(false);
    setSelectedMessages([]);

    // Ensure socket is connected before joining channel
    if (!messageService.socket?.connected) {
      messageService.connect();
    }

    messageService.joinChannel(channel.id, 1);
  };

  const handleScroll = (e) => {
    const element = e.target;
    if (
      Math.abs(element.scrollTop) < 10 &&
      !isLoadingMore &&
      pagination.currentPage < pagination.lastPage
    ) {
      messageService.loadMoreMessages(
        selectedChannel.id,
        pagination.currentPage + 1
      );
    }
  };

  const handleLeaveChannel = async () => {
    if (!selectedChannel?.id) return;

    try {
      await messageService.leaveChannel(selectedChannel.id);
      toast.success("Left group successfully");
      setIsDeleteDialogOpen(false);
      setIsInfoDialogOpen(false);
      setShowMobileList(true);
    } catch (error) {
      console.error("Error leaving channel:", error);
      toast.error("Failed to leave channel: " + error.message);
    }
  };

  // Handle message sending with better error handling
  const handleSendMessage = async (e) => {
    // e.preventDefault();

    if (!selectedChannel || (!newMessage.trim() && !attachment)) return;

    try {
      setSendStatus({ type: "sending", message: "Sending..." });

      await messageService.sendMessage(
        selectedChannel.id,
        newMessage.trim(),
        attachment
      );

      setNewMessage(""); // Clear input after sending
      setAttachment(null); // Clear attachment
      messageService.stopTyping(selectedChannel.id); // Stop typing indicator
      scrollToBottom(); // Scroll to latest message

      // Show success status briefly
      setSendStatus({ type: "success", message: "Message sent!" });
      setTimeout(() => setSendStatus(null), 2000); // Clear status after 2 seconds
    } catch (error) {
      setSendStatus({
        type: "error",
        message: error.message || "Failed to send message",
      });
      setTimeout(() => setSendStatus(null), 3000); // Clear error after 3 seconds
      toast.error(error.message || "Failed to send message");
    }
  };

  // Add this to clear attachment
  const clearAttachment = () => {
    setAttachment(null);
  };

  useEffect(() => {
    const handleTypingStart = ({ channelId, user }) => {
      if (channelId === selectedChannel?.id) {
        setTypingUsers((prev) => new Set(prev).add(user));
      }
    };

    const handleTypingStop = ({ channelId, user }) => {
      if (channelId === selectedChannel?.id) {
        setTypingUsers((prev) => {
          const newSet = new Set(prev);
          newSet.delete(user);
          return newSet;
        });
      }
    };

    messageService.socket?.on("user-typing", handleTypingStart);
    messageService.socket?.on("user-stop-typing", handleTypingStop);

    return () => {
      messageService.socket?.off("user-typing", handleTypingStart);
      messageService.socket?.off("user-stop-typing", handleTypingStop);
    };
  }, [selectedChannel]);

  // Update the input change handler
  const handleInputChange = (e) => {
    const value = e.target.value;
    setNewMessage(value);

    if (!selectedChannel) return;

    // Start typing if there's content
    if (value.trim()) {
      messageService.startTyping(selectedChannel.id);
    }
    // Stop typing if there's no content
    else {
      messageService.stopTyping(selectedChannel.id);
    }
  };

  // Add cleanup for typing state when component unmounts
  useEffect(() => {
    return () => {
      if (selectedChannel) {
        messageService.stopTyping(selectedChannel.id);
      }
    };
  }, [selectedChannel]);

  const handleMessageDelete = async (messageId) => {
    if (!messageId || !selectedChannel?.id) return;

    try {
      await messageService.deleteMessage(selectedChannel.id, messageId);
      setMessageToDelete(null);
    } catch (error) {
      toast.error("Failed to delete message");
    }
  };
  const handleBack = () => {
    handleShowMobileList(true);
    setSelectedChannel(null);
  };

  return (
    <AsyncComponent>
      <Card className="h-full bg-background rounded-none p-0">
        <div className="grid md:grid-cols-8 gap-4 h-full">
          {/* Channels list */}
          <div
            className={`${
              showMobileList ? "block" : "hidden"
            } md:block md:col-span-2 h-full relative rounded-2xl bg-brandLight`}
          >
            {/* Fixed channels header */}
            {/* <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4 border-b bg-brandLight z-1 rounded-tl-2xl rounded-tr-2xl">
              <h2 className="font-bold text-lg">Chats</h2>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setIsGroupChatMode(false);
                    setOpenSheet((prev) => ({
                      ...prev,
                      createChannel: true,
                    }));
                  }}
                  className="rounded-full bg-muted"
                >
                  <PlusIcon className="text-primary w-10 h-10" />
                </Button>
              </div>
            </div> */}

            {/* Scrollable channels list */}
            <div className="absolute top-0 bottom-0 left-0 right-0 overflow-y-auto no_scrollbar">
              <div className="p-4 space-y-2">
                {channelsLoading ? (
                  <ComponentLoading />
                ) : channelsList?.length > 0 ? (
                  <>
                    <div className="flex justify-between">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-primary" />
                        <Input
                          placeholder="Search chats..."
                          className="w-full pl-10 pr-4 h-10 md:h-12 rounded-full outline-none ring-0 bg-background"
                          value={channelSearchQuery}
                          onChange={(e) =>
                            setChannelSearchQuery(e.target.value)
                          }
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setIsGroupChatMode(false);
                          setOpenSheet((prev) => ({
                            ...prev,
                            createChannel: true,
                          }));
                        }}
                        className="rounded-full bg-muted"
                      >
                        <PlusIcon className="text-primary w-10 h-10" />
                      </Button>
                    </div>
                    {channelsList
                      ?.filter((channel) => {
                        const searchTerm = channelSearchQuery.toLowerCase();
                        if (!searchTerm) return true;
                        return (
                          channel.name?.toLowerCase().includes(searchTerm) ||
                          channel.latest_message?.message
                            ?.toLowerCase()
                            .includes(searchTerm)
                        );
                      })
                      ?.sort((a, b) => {
                        const aLatestTime = a.latest_message?.created_at
                          ? new Date(a.latest_message.created_at).getTime()
                          : 0;
                        const bLatestTime = b.latest_message?.created_at
                          ? new Date(b.latest_message.created_at).getTime()
                          : 0;

                        if (aLatestTime && bLatestTime) {
                          return bLatestTime - aLatestTime;
                        }

                        if (aLatestTime) return -1;
                        if (bLatestTime) return 1;

                        const aCreatedTime = new Date(a.created_at).getTime();
                        const bCreatedTime = new Date(b.created_at).getTime();
                        return bCreatedTime - aCreatedTime;
                      })
                      ?.map((channel) => (
                        <div
                          key={channel.id}
                          className={`flex items-center gap-3 p-4 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer ${
                            selectedChannel?.id === channel.id
                              ? "bg-accent"
                              : ""
                          }`}
                          onClick={() => handleChannelSelect(channel)}
                        >
                          <div className="relative">
                            <img
                              src={
                                channel.thumbnail_image_url ||
                                "/default-avatar.png"
                              }
                              alt={channel?.name?.substring(0, 1)}
                              className="w-12 h-12 border border-primary rounded-full object-cover flex items-center justify-center bg-brandSecondary"
                            />
                            {channel?.is_online && (
                              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <h4 className="font-medium truncate">
                                {channel.name || "Direct Message"}
                              </h4>
                              <div className="flex items-center gap-2 shrink-0">
                                {channel.unread_message_count > 0 ? (
                                  <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                                    <span className="text-xs text-primary-foreground">
                                      {channel.unread_message_count || 0}
                                    </span>
                                  </div>
                                ) : (
                                  <div className="shrink-0">
                                    {channel?.latest_message?.read_at ? (
                                      <CheckCheck className="h-4 w-4 text-primary" />
                                    ) : channel?.latest_message
                                        ?.delivered_at ? (
                                      <CheckCheck className="h-4 w-4 text-muted-foreground" />
                                    ) : (
                                      <Check className="h-4 w-4 text-muted-foreground/50" />
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center justify-between gap-2 mt-1">
                              <div className="flex items-center gap-1 flex-1 min-w-0">
                                {channel.latest_message?.message_sent_by_me && (
                                  <span className="text-sm text-muted-foreground shrink-0">
                                    You:{" "}
                                  </span>
                                )}
                                <p className="text-sm text-muted-foreground truncate">
                                  {channel.latest_message?.message ||
                                    "No messages yet"}
                                </p>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {channel.latest_message?.created_at
                                  ? format(
                                      new Date(
                                        channel.latest_message.created_at
                                      ),
                                      "HH:mm"
                                    )
                                  : ""}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-8 justify-center">
                    <div className="flex flex-col items-center gap-2">
                      <h2 className="text-2xl font-bold">No chats yet</h2>
                      <p className="text-muted-foreground text-center">
                        Start a conversation with a family member.
                      </p>
                    </div>
                    <Button
                      className="w-[200px] h-10 md:h-12 rounded-full"
                      onClick={() => {
                        setIsGroupChatMode(false);
                        setOpenSheet((prev) => ({
                          ...prev,
                          createChannel: true,
                        }));
                      }}
                    >
                      <UserPlus className="h-5 w-5" />
                      Start Chat
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Chat area */}
          <div
            className={`${
              showMobileList ? "hidden" : "block"
            } md:block md:col-span-6 h-full relative bg-brandLight rounded-2xl`}
          >
            {selectedChannel ? (
              <>
                <div className="absolute top-0 left-0 right-0 flex items-center justify-between py-4 md:px-4 border-b bg-brandLight z-1 rounded-t-2xl">
                  {isSelectMode ? (
                    <>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setIsSelectMode(false);
                            setSelectedMessages([]);
                          }}
                        >
                          <X className="h-5 w-5" />
                        </Button>
                        <span className="font-medium">
                          {selectedMessages.length} selected
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {selectedMessages.length === 1 && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                const message = messages.find(
                                  (m) => m.id === selectedMessages[0]
                                );
                                if (message) {
                                  setMessageInfoData(message);
                                  setIsSelectMode(false);
                                  setSelectedMessages([]);
                                }
                              }}
                            >
                              <img
                                src="/icons/info-message.svg"
                                className="h-5 w-5"
                              />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                const message = messages.find(
                                  (m) => m.id === selectedMessages[0]
                                );
                                if (message) {
                                  navigator.clipboard.writeText(
                                    message.message
                                  );
                                  toast.success("Message copied to clipboard");
                                  setIsSelectMode(false);
                                  setSelectedMessages([]);
                                }
                              }}
                            >
                              <img
                                src="/icons/copy-message.svg"
                                className="h-5 w-5"
                              />
                            </Button>
                          </>
                        )}

                        {selectedMessages?.length > 0 ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              handleClearChat(selectedMessages);
                              setIsSelectMode(false);
                              setSelectedMessages([]);
                            }}
                          >
                            <img
                              src="/icons/delete-message.svg"
                              className="h-5 w-5"
                            />
                          </Button>
                        ) : null}
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="md:hidden"
                        onClick={handleBack}
                      >
                        <ArrowLeft className="h-5 w-5" />
                      </Button>
                      <img
                        src={
                          selectedChannel.thumbnail_image_url ||
                          "/default-avatar.png"
                        }
                        alt={selectedChannel?.name?.substring(0, 1)}
                        className="w-12 h-12 border border-primary rounded-full object-cover flex items-center justify-center bg-brandSecondary"
                      />
                      <h3 className="font-medium">
                        {selectedChannel.name || "Direct Message"}
                      </h3>
                    </div>
                  )}
                  {!isSelectMode ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-5 w-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="w-52 rounded-2xl p-2"
                      >
                        <DropdownMenuItem
                          onClick={() => setIsInfoDialogOpen(true)}
                          className="bg-transparent flex gap-4 items-center"
                        >
                          <img
                            src="/icons/info-message.svg"
                            className="w-6 h-6"
                          />
                          <div className="w-full text-md">View Info</div>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setIsSelectMode(true); // This should activate select mode
                            setSelectedMessages([]); // Clear any previously selected messages
                          }}
                          className="bg-transparent flex gap-4 items-center"
                        >
                          <img
                            src="/icons/select-message.svg"
                            className="w-6 h-6"
                          />
                          <div className="w-full text-md">Select Messages</div>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : null}
                </div>

                {/* Send status indicator */}
                {sendStatus && (
                  <div
                    className={`absolute top-[84px] left-1/2 -translate-x-1/2 z-20 px-4 py-1 rounded-full text-sm
                      ${
                        sendStatus.type === "success"
                          ? "bg-green-500/10 text-green-700"
                          : sendStatus.type === "error"
                          ? "bg-red-500/10 text-red-700"
                          : "bg-blue-500/10 text-blue-700"
                      }`}
                  >
                    {sendStatus.message}
                  </div>
                )}

                {/* Scrollable messages area */}
                <div
                  className="absolute top-[81px] bottom-[89px] left-0 right-0 overflow-y-auto messages-container no_scrollbar"
                  onScroll={handleScroll}
                >
                  {isLoadingMore && (
                    <div className="text-center p-2 text-sm text-muted-foreground flex items-center justify-center gap-2">
                      <ComponentLoading />
                      Loading more messages...
                    </div>
                  )}

                  {messages.length > 0 ? (
                    <div className="p-4 space-y-4">
                      {messages.map((message) => (
                        <div
                          key={`message-${message.id}`}
                          className={`flex ${
                            message.message_sent_by_me
                              ? "justify-end"
                              : "justify-start"
                          } mb-2 relative group ${
                            isTouchActive ? "touch-active" : ""
                          }`}
                          onTouchStart={() => handleTouchStart(message.id)}
                          onTouchEnd={handleTouchEnd}
                          onTouchCancel={handleTouchEnd}
                          onClick={() => {
                            if (isSelectMode) {
                              handleMessageSelect(message.id);
                            }
                          }}
                        >
                          {isSelectMode && (
                            <div
                              className={cn(
                                "absolute top-1/2 -translate-y-1/2 cursor-pointer left-0 -ml-2"
                              )}
                              onClick={() => handleMessageSelect(message.id)}
                            >
                              <div
                                className={cn(
                                  "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                                  selectedMessages.includes(message.id)
                                    ? "bg-primary border-primary"
                                    : "border-muted-foreground"
                                )}
                              >
                                {selectedMessages.includes(message.id) && (
                                  <Check className="h-3 w-3 text-primary-foreground" />
                                )}
                              </div>
                            </div>
                          )}
                          <div
                            className={cn(
                              "flex flex-col gap-1 max-w-[80%] min-w-[150px]",
                              isSelectMode &&
                                !message.message_sent_by_me &&
                                "ml-6" // Add margin when selection mode is active
                            )}
                          >
                            {!message.message_sent_by_me &&
                              message.created_by && (
                                <span className="text-xs text-muted-foreground ml-2">
                                  {message.created_by.first_name}
                                </span>
                              )}
                            <div
                              className={cn(
                                "px-4 py-2 rounded-2xl break-words relative",
                                message.message_sent_by_me
                                  ? "bg-primary text-primary-foreground rounded-br-sm"
                                  : "bg-muted rounded-bl-sm"
                              )}
                            >
                              {/* <div className="mb-4">{message.message}</div> */}
                              {message.message && (
                                <div className="mb-2">{message.message}</div>
                              )}
                              {message.attachments &&
                                message.attachments.length > 0 && (
                                  <div className="mb-4">
                                    {message.attachments[0].mime.startsWith(
                                      "image/"
                                    ) ? (
                                      <div className="relative max-w-[300px] min-w-[200px]">
                                        <img
                                          src={message.attachments[0].url}
                                          alt={message.attachments[0].name}
                                          className="w-full h-auto object-contain rounded-lg"
                                          onClick={(e) => {
                                            e.stopPropagation();

                                            window.open(
                                              message.attachments[0].url,
                                              "_blank"
                                            );
                                          }}
                                        />
                                        <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded-md">
                                          <span className="text-xs text-white">
                                            {(
                                              message.attachments[0].size /
                                              (1024 * 1024)
                                            ).toFixed(1)}
                                            MB
                                          </span>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-2 bg-background/50 p-2 rounded-lg">
                                        <File className="h-5 w-5 text-primary" />
                                        <div className="flex-1 min-w-0">
                                          <p className="text-sm truncate">
                                            {message.attachments[0].name}
                                          </p>
                                          <span className="text-xs text-muted-foreground">
                                            {(
                                              message.attachments[0].size /
                                              (1024 * 1024)
                                            ).toFixed(1)}
                                            MB
                                          </span>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                              <div
                                className={cn(
                                  "flex items-center gap-2 text-xs absolute bottom-1 right-3",
                                  message.message_sent_by_me
                                    ? "text-primary-foreground/80"
                                    : "text-muted-foreground"
                                )}
                              >
                                <span>
                                  {message.created_at
                                    ? format(
                                        new Date(message.created_at),
                                        "HH:mm"
                                      )
                                    : ""}
                                </span>
                                {message.message_sent_by_me && (
                                  <span>
                                    {message.read_at ? (
                                      <CheckCheck className="h-3 w-3" />
                                    ) : message.delivered_at ? (
                                      <CheckCheck className="h-3 w-3 text-red-300" />
                                    ) : (
                                      <Check className="h-3 w-3" />
                                    )}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-4 h-full gap-4">
                      <img
                        src="/illustrations/message_red.svg"
                        alt="Chat Empty"
                        className="max-w-64 max-h-64"
                      />
                      <div className="text-muted-foreground text-center">
                        Send a message to start the conversation.
                      </div>
                    </div>
                  )}
                </div>

                {/* Fixed bottom section */}
                <div className="absolute bottom-0 left-0 right-0 border-t bg-brandLight rounded-b-2xl">
                  {/* Typing indicator */}

                  {typingUsers.size > 0 && (
                    <div className="absolute bottom-20 left-4 flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{Array.from(typingUsers).join(", ")}</span>
                      <TypingIndicator />
                    </div>
                  )}

                  {/* Message input */}
                  <div className="p-2 md:p-4 pt-5">
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleSendMessage(newMessage);
                      }}
                      className="space-y-2"
                    >
                      {attachment && (
                        <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                          <ImageIcon className="h-5 w-5 text-primary" />
                          <span className="text-sm truncate">
                            {attachment.name}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={clearAttachment}
                            className="ml-auto"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}

                      <div className="relative flex items-end gap-2">
                        {!isFlutter ? (
                          <>
                            <input
                              type="file"
                              id="attachment"
                              accept=".jpg,.jpeg,.png,.gif,.svg"
                              className="hidden"
                              onChange={handleFileSelect}
                            />
                            <button
                              type="button"
                              className="cursor-pointer p-2 hover:bg-muted rounded-full transition-colors"
                              onClick={handleCameraClick}
                            >
                              <Camera className="h-8 w-8 text-primary" />
                            </button>
                          </>
                        ) : null}

                        <div className="relative flex-1">
                          <Textarea
                            value={newMessage}
                            onChange={handleInputChange}
                            placeholder="Type a message..."
                            disabled={!isConnected || isSending}
                            className="resize-none min-h-[20px] max-h-[120px] pr-3 rounded-2xl bg-muted border-0 focus-visible:ring-1 focus-visible:ring-primary no_scrollbar"
                            rows={2}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleSendMessage(newMessage);
                              }
                            }}
                            maxLength={1000}
                          />
                          <div className="absolute right-1 -bottom-4 text-xs text-muted-foreground">
                            {newMessage.length}/1000
                          </div>
                        </div>

                        <Button
                          type="submit"
                          size="icon"
                          className="h-10 w-10 shrink-0 rounded-full"
                          disabled={
                            !isConnected ||
                            isSending ||
                            (!newMessage.trim() && !attachment) ||
                            newMessage.length > 1000
                          }
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </form>
                  </div>
                </div>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                <div>
                  <img
                    src="/illustrations/select_member_to_chat.png"
                    alt="Chat"
                    className="max-w-64 max-h-64"
                  />
                </div>
                <p className="text-center text-sm max-w-[300px]">
                  Select the member from the left menu and start the
                  conversation.
                </p>
              </div>
            )}
          </div>
        </div>
      </Card>
      {/* Chat Info */}
      {isInfoDialogOpen && (
        <Sheet open={isInfoDialogOpen} onOpenChange={setIsInfoDialogOpen}>
          <SheetContent className="overflow-y-scroll no_scrollbar w-full bg-brandLight">
            <SheetHeader className="mb-8">
              <SheetTitle>Chat Information</SheetTitle>
            </SheetHeader>
            <div className="grid gap-1 py-4">
              <div className="flex flex-col items-center gap-4">
                <div className="relative group">
                  <img
                    src={
                      selectedChannel?.thumbnail_image_url ||
                      "/default-avatar.png"
                    }
                    alt={selectedChannel?.name.substring(0, 1)}
                    className="text-2xl font-bold w-24 h-24 border border-primary rounded-full object-cover flex items-center justify-center bg-brandSecondary"
                  />
                  {selectedChannel?.is_group ? (
                    <div
                      className="absolute top-0 right-0 p-1.5 bg-primary rounded-full cursor-pointer hover:bg-primary/90 transition-colors"
                      onClick={() => {
                        setNewChannelData((prev) => ({
                          ...prev,
                          thumbnail_image: null,
                          channelId: selectedChannel.id,
                        }));
                        setOpenSheet((prev) => ({
                          ...prev,
                          updateChannel: true,
                        }));
                        setIsInfoDialogOpen(false);
                      }}
                    >
                      <Pencil className="h-4 w-4 text-white" />
                    </div>
                  ) : null}
                  {selectedChannel?.is_online && (
                    <div className="absolute bottom-2 right-[10px] w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                  )}
                </div>
                {selectedChannel?.is_group ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setNewChannelData((prev) => ({
                        ...prev,
                        name: selectedChannel.name,
                        description: selectedChannel.description,
                        thumbnail_image: null,
                        channelId: selectedChannel.id,
                        is_group: 1,
                      }));
                      setOpenSheet((prev) => ({
                        ...prev,
                        updateChannel: true,
                      }));
                      setIsInfoDialogOpen(false);
                    }}
                    className="text-primary text-sm hover:bg-transparent"
                  >
                    Edit Group
                    <Pencil />
                  </Button>
                ) : null}
                <h3 className="font-semibold text-lg">
                  {selectedChannel?.name || "Direct Message"}
                </h3>
              </div>

              {!selectedChannel?.is_group ? (
                <div className="grid gap-2 justify-center">
                  {selectedChannel?.relation ? (
                    <div className="text-sm">{selectedChannel?.relation}</div>
                  ) : (
                    <div>--</div>
                  )}
                </div>
              ) : (
                <div className="text-center text-sm text-muted-foreground">
                  {selectedChannel?.users?.length} members
                </div>
              )}

              {selectedChannel?.is_group ? (
                <div className="grid gap-2 mt-2">
                  <Label className="text-sm font-semibold">Description</Label>
                  <p className="text-sm text-muted-foreground">
                    {selectedChannel?.description || "No description available"}
                  </p>
                </div>
              ) : null}

              {!selectedChannel?.is_group && (
                <div className="grid gap-2 justify-center">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        selectedChannel?.is_online
                          ? "bg-green-500"
                          : "bg-gray-400"
                      }`}
                    />
                    <span className="text-sm text-muted-foreground">
                      {selectedChannel?.is_online ? "Online" : "Offline"}
                    </span>
                  </div>
                </div>
              )}

              {!selectedChannel?.is_group ? (
                <div className="flex flex-col mt-4">
                  {/* <div
                    className="p-3 bg-background flex gap-4 border-b hover:cursor-pointer"
                    onClick={() =>
                      navigate(`/family-member/${selectedChannel?.user_id}`)
                    }
                  >
                    <CircleUserRound
                      strokeWidth={1.5}
                      className="text-primary w-6"
                    />
                    <span>View Profile</span>
                  </div> */}
                  <div
                    className="p-3 bg-background flex gap-4 hover:cursor-pointer"
                    onClick={handleClearChat}
                  >
                    <Trash2Icon
                      strokeWidth={1.25}
                      className="text-red-600 w-6"
                    />
                    <span className="text-red-500">Clear Chat</span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col mt-4">
                  <div
                    className="p-3 bg-background flex gap-4 border-b hover:cursor-pointer"
                    onClick={() => {}}
                  >
                    <CircleUserRound
                      strokeWidth={1.5}
                      className="text-primary w-6"
                    />
                    <span>Add Member</span>
                  </div>
                  <div
                    className="p-3 bg-background flex gap-4 hover:cursor-pointer border-b"
                    onClick={handleClearChat}
                  >
                    <Trash2Icon
                      strokeWidth={1.25}
                      className="text-red-600 w-6"
                    />
                    <span className="text-red-500">Clear Chat</span>
                  </div>
                  <div
                    className="p-3 bg-background flex gap-4 hover:cursor-pointer"
                    onClick={handleClearChat}
                  >
                    <Trash2Icon
                      strokeWidth={1.25}
                      className="text-red-600 w-6"
                    />
                    <span className="text-red-500">Leave Group</span>
                  </div>
                </div>
              )}

              {selectedChannel?.is_group ? (
                <div className="flex flex-col mt-4">
                  <div className="text-[18px] font-semibold pb-4">
                    Group Members
                  </div>
                  {selectedChannel?.users?.map((member) => (
                    <div
                      key={member.id}
                      className="p-3 bg-background flex gap-4 mb-1"
                      onClick={() =>
                        navigate(`/family-member/${member.user_id}`)
                      }
                    >
                      <img
                        src={member.profile_pic_url || "/default-avatar.png"}
                        alt={member.first_name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <span>{member.first_name}</span>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </SheetContent>
        </Sheet>
      )}
      {/* Delete Chat  */}
      {isDeleteDialogOpen && (
        <Sheet open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <SheetContent className="overflow-y-scroll no_scrollbar w-full">
            <SheetHeader className="mb-8">
              <SheetTitle>
                {selectedChannel?.is_group ? "Leave" : "Clear"} Chat
              </SheetTitle>
              <SheetDescription>
                Are you sure you want to{" "}
                {selectedChannel?.is_group ? "leave" : "clear"} this chat? This
                action cannot be undone.
              </SheetDescription>
            </SheetHeader>
            <SheetFooter className="mt-8 gap-4">
              <Button className="rounded-full">Cancel</Button>
              <Button
                onClick={() => {
                  if (selectedChannel?.is_group) {
                    handleLeaveChannel();
                  } else {
                    handleClearChat([]);
                  }
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-full"
              >
                {selectedChannel?.is_group ? "Leave" : "Clear"}
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      )}
      {/* Delete Message  */}
      {messageToDelete && (
        <Sheet
          open={messageToDelete !== null}
          onOpenChange={(isOpen) => {
            if (!isOpen) setMessageToDelete(null);
          }}
        >
          <SheetContent className="overflow-y-scroll no_scrollbar w-full">
            <SheetHeader className="mb-8">
              <SheetTitle>Delete Message</SheetTitle>
              <SheetDescription>
                Are you sure you want to delete this message? This action cannot
                be undone.
              </SheetDescription>
            </SheetHeader>
            <SheetFooter className="gap-4">
              <Button className="rounded-full">Cancel</Button>
              <Button
                onClick={() => handleMessageDelete(messageToDelete)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-full"
              >
                Delete
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      )}
      {/* Members  */}
      {isMembersDialogOpen && (
        <Sheet open={isMembersDialogOpen} onOpenChange={setIsMembersDialogOpen}>
          <SheetContent className="overflow-y-scroll no_scrollbar w-full">
            <SheetHeader className="mb-8">
              <SheetTitle>
                {isGroupChatMode
                  ? "Create Group Chat"
                  : "Select Member to Chat With"}
              </SheetTitle>
              {isGroupChatMode && (
                <SheetDescription>
                  Select at least 2 members to create a group chat
                </SheetDescription>
              )}
            </SheetHeader>

            <div className="overflow-y-scroll no_scrollbar">
              {familyMembersLoading ? (
                <ComponentLoading />
              ) : familyMembers?.length > 0 ? (
                <div className="space-y-2">
                  {isGroupChatMode && (
                    <div className="flex items-center justify-between px-2 py-1 bg-muted rounded-lg">
                      <span className="text-sm text-muted-foreground">
                        Selected: {selectedMembers.length} members
                      </span>
                      {selectedMembers.length >= 2 ? (
                        <Button
                          size="sm"
                          onClick={() => setIsCreateDialogOpen(true)}
                        >
                          Next
                        </Button>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          Select {2 - selectedMembers.length} more
                        </span>
                      )}
                    </div>
                  )}
                  {familyMembers.map((member) => (
                    <div
                      key={member.id}
                      className={`flex items-center gap-2 p-2 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer ${
                        isGroupChatMode &&
                        selectedMembers.some((m) => m.id === member.id)
                          ? "bg-accent"
                          : ""
                      }`}
                      onClick={() => {
                        if (!isGroupChatMode) {
                          handleMemberSelect(member);
                        }
                      }}
                    >
                      <img
                        src={member.profile_pic_url || "/default-avatar.png"}
                        alt={member.first_name}
                        className="w-10 h-10 rounded-full object-cover border border-primary"
                      />
                      <div className="flex-1">
                        <div className="font-medium">
                          {member.first_name} {member.last_name}
                        </div>
                        {member.email && (
                          <div className="text-sm text-muted-foreground">
                            {member.email}
                          </div>
                        )}
                      </div>
                      {isGroupChatMode && (
                        <Checkbox
                          checked={selectedMembers.some(
                            (m) => m.id === member.id
                          )}
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent parent div click
                            handleMemberSelect(member);
                          }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center p-4">
                  <span className="text-muted-foreground">
                    No members found
                  </span>
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>
      )}
      {/* create group chat */}
      {isCreateDialogOpen && (
        <Sheet
          open={isCreateDialogOpen}
          onOpenChange={(open) => {
            setIsCreateDialogOpen(open);
            if (!open) {
              setNewChannelData({
                name: "",
                description: "",
                thumbnail_image: null,
              });
            }
          }}
        >
          <SheetContent className="overflow-y-scroll no_scrollbar w-full">
            <SheetHeader className="mb-8">
              <SheetTitle>Create Group Chat</SheetTitle>
              <SheetDescription></SheetDescription>
            </SheetHeader>
            <form onSubmit={handleCreateGroupChat}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex flex-col items-center gap-2">
                    <div className="relative group">
                      <input
                        id="thumbnail"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setNewChannelData((prev) => ({
                              ...prev,
                              thumbnail_image: file,
                            }));
                          }
                        }}
                      />
                      <label
                        htmlFor="thumbnail"
                        className="cursor-pointer block"
                      >
                        {newChannelData.thumbnail_image ? (
                          <div className="relative w-24 h-24">
                            <img
                              src={URL.createObjectURL(
                                newChannelData.thumbnail_image
                              )}
                              alt="Thumbnail preview"
                              className="w-24 h-24 rounded-full object-cover border border-primary"
                            />
                            <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <p className="text-white text-xs">Change Image</p>
                            </div>
                          </div>
                        ) : (
                          <div className="w-24 h-24 rounded-full bg-brandSecondary flex items-center justify-center group-hover:bg-muted/80 transition-colors">
                            <div className="flex flex-col items-center">
                              <div className="bg-primary rounded-full p-3">
                                <Camera className="h-8 w-8 text-white mb-1" />
                              </div>
                            </div>
                          </div>
                        )}
                      </label>
                      {newChannelData.thumbnail_image && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          onClick={() =>
                            setNewChannelData((prev) => ({
                              ...prev,
                              thumbnail_image: null,
                            }))
                          }
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    {newChannelData.thumbnail_image && (
                      <p className="text-sm text-muted-foreground">
                        {newChannelData.thumbnail_image.name}
                      </p>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Group Name</Label>
                  <Input
                    id="name"
                    value={newChannelData.name}
                    onChange={(e) =>
                      setNewChannelData((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    placeholder="Enter group name"
                    required
                    className="rounded-full h-10 md:h-12 focus:border-primary outline-none focus:ring-primary focus:ring-2"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newChannelData.description}
                    onChange={(e) =>
                      setNewChannelData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    maxLength={100}
                    placeholder="Group description (optional)"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Selected Members</Label>
                  <div className="flex flex-wrap gap-2 p-2 border rounded-lg overflow-y-scroll max-h-[200px] min-h-[100px] no_scrollbar">
                    {selectedMembers.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center gap-1 rounded-full px-3 py-1 bg-primary/80"
                      >
                        <img
                          src={member.profile_pic_url || "/default-avatar.png"}
                          alt={member.first_name}
                          className="w-5 h-5 rounded-full object-cover border border-primary"
                        />
                        <span className="text-sm text-white">
                          {member.first_name} {member.last_name}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 hover:bg-transparent"
                          onClick={() => handleMemberSelect(member)}
                        >
                          <X className="h-3 w-3 text-white" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <SheetFooter className="mt-4 flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                  className="rounded-full"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={!newChannelData.name || selectedMembers.length < 2}
                  className="rounded-full"
                >
                  Create Group
                </Button>
              </SheetFooter>
            </form>
          </SheetContent>
        </Sheet>
      )}
      {/* Message Info */}
      {messageInfoData && (
        <Sheet
          open={messageInfoData !== null}
          onOpenChange={(open) => !open && setMessageInfoData(null)}
        >
          <SheetContent className="overflow-y-scroll no_scrollbar w-full">
            <div className="flex items-center justify-between p-4">
              <SheetTitle className="text-xl font-medium">
                Message info
              </SheetTitle>
            </div>

            <div className="px-4 pb-4">
              {/* Message Content */}
              <div className="bg-primary/90 text-primary-foreground rounded-2xl p-4 mb-6 max-w-[90%]">
                <p className="text-base mb-2">{messageInfoData?.message}</p>
                <div className="flex justify-end">
                  <span className="text-sm text-primary-foreground/90">
                    {messageInfoData?.created_at &&
                      format(new Date(messageInfoData.created_at), "HH:mm a")}
                  </span>
                </div>
              </div>

              <hr className="border-t border-muted-foreground/20 mb-4" />

              {/* Read/Delivered Status */}
              {!selectedChannel?.is_group ? (
                <div className="space-y-4 bg-[#FFF5E8] rounded-xl p-4">
                  {messageInfoData?.read_at ? (
                    <div className="flex items-center justify-between border-b">
                      <div className="flex items-center gap-3">
                        <CheckCheck className="h-5 w-5 text-primary" />
                        <span className="text-base">Read</span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-sm text-muted-foreground">
                          {format(
                            new Date(messageInfoData.read_at),
                            "MMM d, HH:mm"
                          )}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between border-b pb-4">
                      <div className="flex items-center gap-3">
                        <CheckCheck className="h-5 w-5 text-primary" />
                        <span className="text-base">Read</span>
                      </div>
                    </div>
                  )}

                  {messageInfoData?.delivered_at ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Check className="h-5 w-5 text-muted-foreground" />
                        <span className="text-base">Delivered</span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-sm">
                          {format(
                            new Date(messageInfoData.delivered_at),
                            "HH:mm a"
                          )}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Check className="h-5 w-5 text-muted-foreground" />
                        <span className="text-base">Delivered</span>
                      </div>
                    </div>
                  )}
                </div>
              ) : null}

              {/* For Group Messages - Show read status per member */}
              {selectedChannel?.is_group && messageInfoData?.read_by ? (
                <div className="mt-4 pt-4 border-t">
                  <h4 className="text-sm font-medium mb-3">Read by</h4>
                  <div className="space-y-3">
                    {messageInfoData.read_by.map((reader) => (
                      <div
                        key={reader.id}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <img
                            src={
                              reader.profile_pic_url || "/default-avatar.png"
                            }
                            alt={reader.first_name}
                            className="w-6 h-6 rounded-full"
                          />
                          <span className="text-sm">
                            {reader.first_name} {reader.last_name}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(reader.read_at), "HH:mm")}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </SheetContent>
        </Sheet>
      )}
      {/* create channel */}
      {openSheet.createChannel && (
        <Sheet
          className={`block md:hidden ${
            openSheet.createChannel ? "open" : "closed"
          }`}
          open={openSheet.createChannel}
          onOpenChange={() =>
            setOpenSheet((prev) => ({ ...prev, createChannel: false }))
          }
        >
          <SheetTrigger></SheetTrigger>
          <SheetContent className="overflow-y-scroll no_scrollbar w-full">
            <SheetHeader className="mb-8">
              <SheetTitle className="py-4 flex flex-col gap-2 items-center">
                Start Chat
              </SheetTitle>
            </SheetHeader>
            <SheetDescription className="hidden"></SheetDescription>
            <div className="space-y-2">
              <div className="px-4 text-sm text-muted-foreground">
                {isGroupChatMode
                  ? `Select members for group chat`
                  : "Select a person to chat with"}
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-primary" />
                <Input
                  placeholder="Search chats..."
                  className="w-full pl-10 pr-4 h-10 md:h-12 rounded-full outline-none ring-0 bg-background"
                  value={memberSearchQuery}
                  onChange={(e) => {
                    setMemberSearchQuery(e.target.value);
                  }}
                />
              </div>
              {/* {isGroupChatMode ? (
                <div className="flex items-center justify-between gap-2 cursor-pointer border-b py-4">
                  <div className="text-sm">
                    Total Members: {selectedMembers.length}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    Select all:{" "}
                    <div
                      className={cn(
                        "flex items-center justify-center w-5 h-5 border border-primary rounded-full cursor-pointer",
                        "mr-4",
                        selectedMembers.length ===
                          familyMembers.filter((item) => item.is_active)?.length
                          ? "bg-primary"
                          : "bg-accent"
                      )}
                      onClick={() => {
                        if (
                          selectedMembers.length ===
                          familyMembers.filter((member) => member.is_active)
                            .length
                        ) {
                          setSelectedMembers([]);
                        } else {
                          setSelectedMembers(
                            familyMembers.filter((item) => item.is_active)
                          );
                        }
                      }}
                    >
                      {selectedMembers.length ===
                        familyMembers.filter((member) => member.is_active)
                          .length && (
                        <Check className="w-4 h-4 text-background" />
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  className="flex items-center justify-center gap-2 cursor-pointer border-b  py-4"
                  onClick={() => {
                    setIsGroupChatMode(true);
                  }}
                >
                  <Button variant="outline" className="w-fit rounded-full h-10">
                    <Users className="w-6 h-6 text-primary" />
                    <span className="text-md">Create Group</span>
                  </Button>
                </div>
              )} */}
              {Array.isArray(familyMembers) &&
                familyMembers
                  ?.filter((member) => {
                    if (!memberSearchQuery) return true;

                    const searchTerm = memberSearchQuery.toLowerCase();
                    return (
                      member.first_name?.toLowerCase().includes(searchTerm) ||
                      member.last_name?.toLowerCase().includes(searchTerm)
                    );
                  })
                  ?.filter((member) => member.is_alive)
                  ?.sort((a, b) => {
                    if (a.is_active && !b.is_active) return -1;
                    if (!a.is_active && b.is_active) return 1;
                    return (a.first_name || "").localeCompare(
                      b.first_name || ""
                    );
                  })
                  ?.map((member) => (
                    <div
                      key={member.id}
                      className={cn(
                        "flex items-center gap-3 p-4 cursor-pointer hover:bg-primary/10 transition-colors relative",
                        isGroupChatMode &&
                          selectedMembers.some((m) => m.id === member.id) &&
                          "bg-primary/20",
                        !member.is_active && "opacity-50 cursor-context-none",
                        "border-b"
                      )}
                      onClick={() => {
                        if (member.is_active) {
                          handleMemberSelect(member);
                          setMemberSearchQuery("");
                        }
                      }}
                    >
                      <img
                        src={member.profile_pic_url || "/default-avatar.png"}
                        alt={member.first_name}
                        className="w-10 h-10 border border-primary rounded-full object-cover"
                      />
                      <div className="flex-1">
                        <div className="font-medium line-clamp-1 text-ellipsis max-w-[175px]">
                          {member.first_name} {member.last_name}
                        </div>
                        {member.relation && (
                          <div className="text-sm text-muted-foreground">
                            {member.relation}
                          </div>
                        )}
                      </div>
                      {!member.is_active && (
                        <div className="px-2 py-1 text-xs text-white bg-primary rounded-full absolute right-4 top-5">
                          Inactive
                        </div>
                      )}

                      {isGroupChatMode && member.is_active ? (
                        selectedMembers.some((m) => m.id === member.id) ? (
                          <div className="flex items-center justify-center w-5 h-5 border border-primary rounded-full bg-primary">
                            <Check className="w-4 h-4 text-background" />
                          </div>
                        ) : (
                          <div className="flex items-center justify-center w-5 h-5 border border-primary rounded-full bg-accent"></div>
                        )
                      ) : null}
                    </div>
                  ))}
              {isGroupChatMode && selectedMembers.length >= 2 && (
                <div className="sticky bottom-[-24px] py-4 bg-brandLight flex items-center justify-end gap-2">
                  <Button
                    variant="outline"
                    className="rounded-full h-10"
                    onClick={() => {
                      setIsGroupChatMode(false);
                      setSelectedMembers([]);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="rounded-full h-10"
                    onClick={() => setIsCreateDialogOpen(true)}
                  >
                    Create Group
                  </Button>
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>
      )}
      {/* Update Channel */}
      {openSheet.updateChannel && (
        <Sheet
          open={openSheet.updateChannel}
          onOpenChange={(open) => {
            if (!open) {
              reset();
              setNewChannelData({
                name: "",
                description: "",
                thumbnail_image: null,
                channelId: null,
              });
              setNewMembersToAdd([]);
            }
            setOpenSheet((prev) => ({ ...prev, updateChannel: open }));
          }}
        >
          <SheetContent className="overflow-y-scroll no_scrollbar w-full">
            <SheetHeader className="mb-8">
              <SheetTitle>Update Group Chat</SheetTitle>
            </SheetHeader>
            <form onSubmit={handleSubmit(handleUpdateSubmit)}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex flex-col items-center gap-2">
                    <Controller
                      name="thumbnail_image"
                      control={control}
                      render={({ field }) => (
                        <div className="relative group">
                          <input
                            id="thumbnail"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                field.onChange(file);
                                setNewChannelData((prev) => ({
                                  ...prev,
                                  thumbnail_image: file,
                                }));
                              }
                            }}
                          />
                          <label
                            htmlFor="thumbnail"
                            className="cursor-pointer block"
                          >
                            {newChannelData.thumbnail_image ? (
                              <div className="relative w-24 h-24">
                                <img
                                  src={URL.createObjectURL(
                                    newChannelData.thumbnail_image
                                  )}
                                  alt="Thumbnail preview"
                                  className="w-24 h-24 rounded-full object-cover border border-primary"
                                />
                                <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <p className="text-white text-xs">
                                    Change Image
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <div className="w-24 h-24 rounded-full bg-brandSecondary flex items-center justify-center group-hover:bg-muted/80 transition-colors">
                                <img
                                  src={
                                    selectedChannel?.thumbnail_image_url ||
                                    "/default-avatar.png"
                                  }
                                  alt="Channel thumbnail"
                                  className="w-24 h-24 rounded-full object-cover border border-primary"
                                />
                                <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-colors flex items-center justify-center">
                                  <p className="text-white text-xs">
                                    Change Image
                                  </p>
                                </div>
                              </div>
                            )}
                          </label>
                          {newChannelData.thumbnail_image && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              onClick={() => {
                                field.onChange(null);
                                setNewChannelData((prev) => ({
                                  ...prev,
                                  thumbnail_image: null,
                                }));
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      )}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Group Name</Label>
                  <Controller
                    name="name"
                    control={control}
                    render={({ field, fieldState }) => (
                      <>
                        <Input
                          {...field}
                          id="name"
                          placeholder="Enter group name"
                          className="rounded-full h-10 md:h-12 focus:border-primary outline-none focus:ring-primary focus:ring-2"
                        />
                        {fieldState.error && (
                          <p className="text-sm text-destructive">
                            {fieldState.error.message}
                          </p>
                        )}
                      </>
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Controller
                    name="description"
                    control={control}
                    render={({ field, fieldState }) => (
                      <>
                        <Textarea
                          {...field}
                          id="description"
                          maxLength={100}
                          placeholder="Group description (optional)"
                        />
                        {fieldState.error && (
                          <p className="text-sm text-destructive">
                            {fieldState.error.message}
                          </p>
                        )}
                      </>
                    )}
                  />
                </div>
                {/* add new members to be resolved later */}
                {/* <div className="space-y-2 mt-4">
                  <Label>Add Members</Label>
                  <div className="space-y-2">
                    {newMembersToAdd.length > 0 && (
                      <div className="flex flex-wrap gap-2 p-2 border rounded-lg">
                        {newMembersToAdd.map((member) => (
                          <div
                            key={member.id}
                            className="flex items-center gap-1 rounded-full px-3 py-1 bg-primary/80"
                          >
                            <img
                              src={
                                member.profile_pic_url || "/default-avatar.png"
                              }
                              alt={member.first_name}
                              className="w-5 h-5 rounded-full object-cover border border-primary"
                            />
                            <span className="text-sm text-white">
                              {member.first_name} {member.last_name}
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-4 w-4 p-0 hover:bg-transparent"
                              onClick={() => handleUpdateGroupMembers(member)}
                            >
                              <X className="h-3 w-3 text-white" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="max-h-[400px] overflow-y-auto border rounded-lg p-2 no_scrollbar">
                      {familyMembers
                        ?.filter(
                          (member) =>
                            !selectedChannel?.users?.some(
                              (u) => u.id === member.id
                            ) && member.is_active
                        )
                        ?.map((member) => (
                          <div
                            key={member.id}
                            className={cn(
                              "flex items-center gap-2 p-2 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer",
                              newMembersToAdd.some((m) => m.id === member.id) &&
                                "bg-accent"
                            )}
                            onClick={() => handleUpdateGroupMembers(member)}
                          >
                            <img
                              src={
                                member.profile_pic_url || "/default-avatar.png"
                              }
                              alt={member.first_name}
                              className="w-8 h-8 rounded-full object-cover border border-primary"
                            />
                            <div className="flex-1">
                              <div className="font-medium">
                                {member.first_name} {member.last_name}
                              </div>
                              {member.email && (
                                <div className="text-sm text-muted-foreground">
                                  {member.email}
                                </div>
                              )}
                            </div>
                            <Checkbox
                              checked={newMembersToAdd.some(
                                (m) => m.id === member.id
                              )}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUpdateGroupMembers(member);
                              }}
                            />
                          </div>
                        ))}
                    </div>
                  </div>
                </div> */}
                <SheetFooter className="mt-4 flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      setOpenSheet((prev) => ({
                        ...prev,
                        updateChannel: false,
                      }))
                    }
                    className="rounded-full"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="rounded-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Updating..." : "Update Group"}
                  </Button>
                </SheetFooter>
              </div>
            </form>
          </SheetContent>
        </Sheet>
      )}
    </AsyncComponent>
  );
}
