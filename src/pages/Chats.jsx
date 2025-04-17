// frontend/src/pages/Chats.jsx (or ChatPage.jsx)
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router"; // Corrected import path
import useAuthStore from "@/chats/useAuthStore"; // Assuming correct path
import useChatStore from "@/chats/useChatStore"; // Assuming correct path
import {
  connectSocket,
  disconnectSocket,
  getSocket,
} from "@/chats/socketService"; // Assuming correct path
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger, // Keep if needed elsewhere, though not used directly here
  DrawerClose, // Keep if needed elsewhere
} from "@/components/ui/drawer";
import CreateChatView from "@/chats/CreateChatView"; // Assuming correct path
import ChatList from "@/chats/ChatList"; // Assuming correct path
import ChatWindow from "@/chats/ChatWindow"; // Assuming correct path
import { Toaster } from "@/components/ui/sonner";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { MessageSquarePlus } from "lucide-react";
import ContactInfoView from "@/chats/ContactInfoView"; // Assuming correct path
import MessageInfoView from "@/chats/MessageInfoView"; // Assuming correct path
import { Card } from "@/components/ui/card"; // Import Card

const Chats = () => {
  const { token: urlToken } = useParams();
  const navigate = useNavigate();
  const {
    setToken,
    token: storedToken,
    isAuthenticated,
    logout, // Keep if used elsewhere
  } = useAuthStore();
  const {
    activeChannelId,
    setActiveChannelId,
    resetChatState,
    updateChannelInList,
  } = useChatStore(); // Added updateChannelInList directly
  const [isConnecting, setIsConnecting] = useState(false);
  const [initialAuthDone, setInitialAuthDone] = useState(false);
  const [socketError, setSocketError] = useState(null); // Keep socket error state
  const [isContactInfoOpen, setIsContactInfoOpen] = useState(false);
  const [viewingContactData, setViewingContactData] = useState(null);
  const [isMessageInfoOpen, setIsMessageInfoOpen] = useState(false);
  const [viewingMessageData, setViewingMessageData] = useState(null);
  const [isCreateChatOpen, setIsCreateChatOpen] = useState(false);
  // Removed getState call for updateChannelInList

  const handleOpenCreateChat = () => {
    setIsCreateChatOpen(true);
  };

  const handleViewContactInfo = (channelData) => {
    if (!channelData) return;
    setViewingContactData(channelData);
    setIsContactInfoOpen(true);
  };

  const handleViewMessageInfo = (messageData) => {
    if (!messageData) return;
    setViewingMessageData(messageData);
    setIsMessageInfoOpen(true);
  };

  const handleChannelCreated = (newChannelData) => {
    if (!newChannelData || !newChannelData.id) {
      return;
    }

    updateChannelInList(newChannelData);
    setActiveChannelId(newChannelData.id);
    setShowChatList(false);
    setIsCreateChatOpen(false);
  };

  // Removed renderChatList function, logic moved inline

  // Mobile view state
  const [showChatList, setShowChatList] = useState(true);

  // --- Socket Connection useEffect ---
  useEffect(() => {
    const socket = getSocket();
    let timeoutId = null; // Define timeoutId here
    let handleConnect = null; // Define handlers here
    let handleConnectError = null;
    let tempSocket = null; // Define tempSocket

    // Function to clean up listeners specific to this effect instance
    const cleanupListeners = () => {
      if (tempSocket) {
        if (handleConnect) tempSocket.off("connect", handleConnect);
        if (handleConnectError)
          tempSocket.off("connect_error", handleConnectError);
      }
      if (timeoutId) clearTimeout(timeoutId);
    };

    if (storedToken && !socket?.connected && !socketError) {
      setIsConnecting(true);
      setSocketError(null);
      connectSocket(); // Assuming this might return the socket or setup happens async

      // Allow time for socket instance to potentially be created/ready
      // A better approach might involve connectSocket returning a promise
      // or emitting a custom event locally when ready.
      setTimeout(() => {
        tempSocket = getSocket(); // Get socket instance after potential init
        if (tempSocket && !tempSocket.connected) {
          // Check connection status again
          handleConnect = () => {
            setIsConnecting(false);
            setInitialAuthDone(true);
            setSocketError(null);
            cleanupListeners();
          };
          handleConnectError = (error) => {
            setIsConnecting(false);
            setInitialAuthDone(true);
            setSocketError(error?.message || "Connection failed");
            cleanupListeners();
          };

          tempSocket.once("connect", handleConnect);
          tempSocket.once("connect_error", handleConnectError);

          // Safety timeout for connection attempt
          timeoutId = setTimeout(() => {
            if (isConnecting && !getSocket()?.connected) {
              // Re-check connection status
              setIsConnecting(false);
              setInitialAuthDone(true);
              setSocketError("Connection timed out");
              cleanupListeners();
              disconnectSocket();
            }
          }, 10000);
        } else if (tempSocket?.connected) {
          // Already connected by the time we checked
          setIsConnecting(false);
          setInitialAuthDone(true);
          setSocketError(null);
        } else {
          setIsConnecting(false);
          setInitialAuthDone(true);
          setSocketError("Failed to initialize socket.");
        }
      }, 100); // Short delay to allow async socket setup
    } else if (socket?.connected) {
      setIsConnecting(false);
      setInitialAuthDone(true);
      setSocketError(null);
    } else if (!storedToken) {
      setInitialAuthDone(true);
      setSocketError("Authentication token missing.");
    }

    // Cleanup on component unmount OR dependency change
    return () => {
      cleanupListeners(); // Clean up timers and listeners from this effect run
    };
  }, [storedToken, socketError]); // Only re-run if token changes or we clear error to retry

  // --- Token Handling useEffect ---
  useEffect(() => {
    if (urlToken && !storedToken) {
      setToken(urlToken);
      // Setting isConnecting here might be redundant if handled by the connection effect
    } else if (!urlToken && !storedToken) {
      console.error("No authentication token found.");
      // Handle redirect or error display appropriately
    }
  }, [urlToken, storedToken, setToken, navigate]); // Dependencies for token handling

  // --- Socket Disconnect on Unmount useEffect ---
  useEffect(() => {
    // This effect ONLY handles the disconnect on unmount
    return () => {
      console.log("Chats component unmounting, disconnecting socket.");
      disconnectSocket();
      resetChatState();
    };
  }, [resetChatState]); // resetChatState is stable

  // --- Mobile View Handling ---
  const handleSelectChat = (channelId) => {
    setActiveChannelId(channelId);
    setShowChatList(false);
  };

  const handleBackToList = () => {
    setActiveChannelId(null);
    setShowChatList(true);
  };

  // --- Render Logic ---

  if (isConnecting && !initialAuthDone) {
    // Show loader only during initial connection attempt
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Connecting to chat...</p>
      </div>
    );
  }

  if (initialAuthDone && (!isAuthenticated || socketError)) {
    return (
      <div className="flex flex-col h-full items-center justify-center text-center p-4">
        <p className="text-destructive font-semibold mb-2">
          Chat Connection Failed
        </p>
        <p className="text-muted-foreground text-sm mb-4">
          {socketError || "Authentication failed. Please check login status."}
        </p>
        <Button
          onClick={() => {
            setSocketError(null); // Clear error to allow retry via useEffect
            setIsConnecting(false); // Reset connecting flag
            setInitialAuthDone(false); // Reset auth flag
            // Attempt connection again on next render cycle via useEffect
          }}
        >
          Retry Connection
        </Button>
      </div>
    );
  }

  return (
    // Use Card as the top-level container with desired styling
    <Card
      className="bg-background rounded-2xl h-full w-full flex flex-col overflow-hidden"
      data-safe-focus
      tabIndex="0" // Make it focusable with tabIndex="0" not "-1"
      id="chat-card-container"
    >
      {/* --- Drawers outside the main layout grid --- */}
      <Drawer
        open={isCreateChatOpen}
        onOpenChange={(open) => setIsCreateChatOpen(open)}
      >
        <DrawerContent className="h-[85%] sm:h-[70%]">
          <div className="flex flex-col h-full w-full max-w-xl mx-auto">
            <DrawerHeader className="flex-shrink-0">
              <DrawerTitle>Start New Chat</DrawerTitle>
            </DrawerHeader>
            <div className="flex-1 min-h-0">
              <CreateChatView
                onClose={() => setIsCreateChatOpen(false)}
                onChannelCreated={handleChannelCreated}
              />
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      <Drawer
        open={isContactInfoOpen}
        onOpenChange={(open) => setIsContactInfoOpen(open)}
      >
        <DrawerContent className="h-[85%] sm:h-[70%]">
          <div className="flex flex-col h-full w-full max-w-md mx-auto">
            <DrawerHeader className="flex-shrink-0 text-left">
              <DrawerTitle>
                {viewingContactData?.is_group ? "Group Info" : "Contact Info"}
              </DrawerTitle>
            </DrawerHeader>
            <div className="flex-1 min-h-0 overflow-y-auto">
              {viewingContactData && (
                <ContactInfoView channel={viewingContactData} />
              )}
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      <Drawer
        open={isMessageInfoOpen}
        onOpenChange={(open) => setIsMessageInfoOpen(open)}
      >
        <DrawerContent className="h-auto max-h-[50%]">
          <div className="flex flex-col h-full w-full max-w-md mx-auto p-4">
            <DrawerHeader className="p-0 mb-4 text-left">
              <DrawerTitle>Message Info</DrawerTitle>
            </DrawerHeader>
            {viewingMessageData && (
              <MessageInfoView message={viewingMessageData} />
            )}
          </div>
        </DrawerContent>
      </Drawer>

      {/* --- Main Grid Layout for Chat --- */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat List Pane - Grid Area 1 */}
        <div
          className={cn(
            "w-full md:w-[300px] lg:w-[340px]", // Define width for 'auto' column
            "h-full flex-shrink-0", // Fill grid row height
            "border-r bg-background",
            "transition-transform duration-300 ease-in-out",
            !showChatList ? "hidden md:block" : "block"
          )}
        >
          <ChatList
            onSelectChat={handleSelectChat}
            onInitiateCreateChat={handleOpenCreateChat}
          />
        </div>

        {/* Chat Window Pane - Grid Area 2 */}
        <div
          className={cn(
            "h-full flex-1 min-w-0",
            showChatList ? "hidden md:block" : "block"
          )}
        >
          {activeChannelId ? ( // Conditionally render ChatWindow only if ID exists
            <ChatWindow
              channelId={activeChannelId}
              onBack={handleBackToList}
              onViewContactInfo={handleViewContactInfo}
              onViewMessageInfo={handleViewMessageInfo}
            />
          ) : (
            // Render placeholder if no channel selected (important for desktop view)
            <div className="flex flex-col h-full items-center justify-center text-muted-foreground bg-muted/20">
              <p>Select a chat to start messaging</p>
            </div>
          )}
        </div>
      </div>

      {/* Toaster should ideally be placed higher in the tree, like in App.jsx or layout */}
      <Toaster position="top-right" richColors />
    </Card>
  );
};

export default Chats;
