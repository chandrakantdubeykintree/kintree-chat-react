// src/pages/Chats.jsx (or ChatPage.jsx)
import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
  useMemo,
} from "react"; // Added useRef, useCallback, useMemo
import { useParams, useNavigate } from "react-router";
import useAuthStore from "@/chats/useAuthStore";
import useChatStore from "@/chats/useChatStore";
import {
  connectSocket,
  disconnectSocket,
  fetchChannels,
  getSocket,
} from "@/chats/socketService";
import { fetchCurrentUser } from "@/chats/apiService"; // <-- IMPORT fetchCurrentUser

// UI Components
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  // DrawerTrigger,
  // DrawerClose,
} from "@/components/ui/drawer";
import { Card } from "@/components/ui/card";
import { Toaster } from "@/components/ui/sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Chat Components
import CreateChatView from "@/chats/CreateChatView";
import ChatList from "@/chats/ChatList";
import ChatWindow from "@/chats/ChatWindow";
import ContactInfoView from "@/chats/ContactInfoView";
import MessageInfoView from "@/chats/MessageInfoView";

const Chats = () => {
  const { token: urlToken } = useParams();
  const navigate = useNavigate();

  // Auth Store
  const {
    setToken,
    token: storedToken,
    isAuthenticated, // Keep track if token is set
    user, // The user object from the store
    setUser, // Action to set the user
    logout,
  } = useAuthStore();

  // Chat Store
  const {
    activeChannelId,
    setActiveChannelId,
    resetChatState,
    updateChannelInList,
  } = useChatStore();

  // Component State
  const [isUserLoading, setIsUserLoading] = useState(false); // Separate state for user loading
  const [isConnecting, setIsConnecting] = useState(false); // Socket connecting state
  const [connectionAttempted, setConnectionAttempted] = useState(false); // Track if initial attempt happened
  const [connectionError, setConnectionError] = useState(null); // Local error state

  // Refs for async operations / stale closures
  const connectingRef = useRef(isConnecting);
  useEffect(() => {
    connectingRef.current = isConnecting;
  }, [isConnecting]);

  // Drawer States
  const [isContactInfoOpen, setIsContactInfoOpen] = useState(false);
  const [viewingContactData, setViewingContactData] = useState(null);
  const [isMessageInfoOpen, setIsMessageInfoOpen] = useState(false);
  const [viewingMessageData, setViewingMessageData] = useState(null);
  const [isCreateChatOpen, setIsCreateChatOpen] = useState(false);

  // Mobile View State
  const [showChatList, setShowChatList] = useState(true);

  // --- Handlers ---
  const handleOpenCreateChat = () => setIsCreateChatOpen(true);
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
    if (!newChannelData?.id) return;
    updateChannelInList(newChannelData);
    setActiveChannelId(newChannelData.id);
    setShowChatList(false);
    setIsCreateChatOpen(false);
  };
  const handleSelectChat = (channelId) => {
    setActiveChannelId(channelId);
    setShowChatList(false);
  };
  const handleBackToList = () => {
    setActiveChannelId(null);
    setShowChatList(true);
  };

  // --- Effect 1: Handle Token from URL ---
  useEffect(() => {
    if (urlToken && urlToken !== storedToken) {
      // Only set if different
      console.log("[Token Effect] Setting token from URL param.");
      setToken(urlToken);
      // Clear potentially stale user data/errors when token changes
      setUser(null);
      setConnectionError(null);
      setConnectionAttempted(false); // Reset flags to trigger re-init
      setIsConnecting(false);
      connectingRef.current = false;
      setIsUserLoading(false);
      if (getSocket()) disconnectSocket(); // Disconnect old socket if exists
    } else if (!urlToken && !storedToken) {
      console.error("[Token Effect] No token found in URL or store.");
      // Optional: Redirect to login
      // navigate('/login');
    }
  }, [urlToken, storedToken, setToken, navigate, setUser]);

  // --- Effect 2: Fetch User Data and Connect Socket AFTER Token is Available ---
  useEffect(() => {
    let isMounted = true; // Prevent state updates on unmounted component
    let socketInstance = null; // Keep track of socket instance for cleanup
    let connectHandler, connectErrorHandler, disconnectHandler; // Listener refs for cleanup

    const initializeAuthAndSocket = async () => {
      // Guard: Only run if token exists and user isn't already loaded/loading
      if (!storedToken || user || isUserLoading || isConnecting) {
        console.log(
          "[Auth+Socket Effect] Skipping: No token, user loaded, or already loading/connecting.",
          {
            hasToken: !!storedToken,
            userLoaded: !!user,
            isUserLoading,
            isConnecting,
          }
        );
        // If we have a token and user, ensure connection attempt flag is set
        if (storedToken && user) setConnectionAttempted(true);
        return;
      }

      console.log(
        "[Auth+Socket Effect] Token found. Attempting to fetch user data..."
      );
      setIsUserLoading(true);
      setConnectionError(null); // Clear previous errors

      try {
        // 1. Fetch User Data
        const userData = await fetchCurrentUser(); // Uses token from store via apiService interceptor

        if (!isMounted) return;
        console.log(
          "[Auth+Socket Effect] User data fetched, setting user in store."
        );
        setUser(userData); // <<< --- SET USER IN STORE ---
        setIsUserLoading(false);

        // 2. Connect Socket (only if not already connected/connecting)
        if (!getSocket()?.connected && !connectingRef.current) {
          console.log(
            "[Auth+Socket Effect] User set, attempting socket connection."
          );
          setIsConnecting(true);
          connectingRef.current = true;
          setConnectionAttempted(true); // Mark socket connection attempt

          socketInstance = connectSocket(); // connectSocket uses token from store

          if (!socketInstance) {
            if (!isMounted) return;
            setIsConnecting(false);
            connectingRef.current = false;
            setConnectionError("Failed to initialize socket.");
            return;
          }

          // --- Define Socket Handlers ---
          connectHandler = () => {
            if (!isMounted) return;
            console.log("[Auth+Socket Effect] Socket connected successfully.");
            setIsConnecting(false);
            connectingRef.current = false;
            setConnectionError(null);
          };

          connectErrorHandler = (error) => {
            if (!isMounted) return;
            console.error("[Auth+Socket Effect] Socket connect_error:", error);
            setIsConnecting(false);
            connectingRef.current = false;
            setConnectionError(error?.message || "Connection failed");
            if (error.message.includes("Authentication error")) {
              logout();
              resetChatState();
            }
          };

          disconnectHandler = (reason) => {
            if (!isMounted) return;
            console.warn(`[Auth+Socket Effect] Socket disconnected: ${reason}`);
            if (
              reason === "io server disconnect" ||
              reason === "parse error" ||
              reason === "transport error"
            ) {
              setIsConnecting(false);
              connectingRef.current = false;
              setConnectionError(`Disconnected: ${reason}`);
              if (reason === "io server disconnect") {
                logout();
                resetChatState();
              }
            }
            // Allow socket.io's default reconnection logic to handle other cases
          };
          // --- Attach Socket Handlers ---
          socketInstance.once("connect", connectHandler);
          socketInstance.once("connect_error", connectErrorHandler);
          socketInstance.on("disconnect", disconnectHandler); // Persistent listener
        } else if (getSocket()?.connected) {
          if (!isMounted) return;
          console.log("[Auth+Socket Effect] Socket was already connected.");
          setIsConnecting(false); // Ensure state is correct
          connectingRef.current = false;
          setConnectionAttempted(true);
          setConnectionError(null);
        }
      } catch (error) {
        // Catch errors from fetchCurrentUser
        if (!isMounted) return;
        console.error(
          "[Auth+Socket Effect] Failed to fetch user data:",
          error.message
        );
        setIsUserLoading(false);
        setConnectionError(`Authentication failed: ${error.message}`);
        setConnectionAttempted(true); // Mark attempt as made, even if failed
        if (error.message === "Unauthorized") {
          // Handle specific auth error
          logout();
          resetChatState();
        }
        if (getSocket()?.connected) disconnectSocket(); // Disconnect if socket connected before fetch fail
      }
    };

    initializeAuthAndSocket();

    // Cleanup function
    return () => {
      isMounted = false;
      // Clean up listeners attached by *this specific effect run*
      const currentSocket = getSocket(); // Get socket instance at cleanup time
      if (currentSocket) {
        if (connectHandler) currentSocket.off("connect", connectHandler);
        if (connectErrorHandler)
          currentSocket.off("connect_error", connectErrorHandler);
        if (disconnectHandler)
          currentSocket.off("disconnect", disconnectHandler);
      }
      console.log("[Auth+Socket Effect] Cleanup.");
      // Note: Main unmount effect handles the final disconnectSocket()
    };
    // Run ONLY when the token changes. User loading/connection state is handled internally.
  }, [storedToken, setUser, logout, resetChatState]);

  // --- Effect 3: Socket Disconnect on Unmount ---
  useEffect(() => {
    // This effect ONLY handles the disconnect on final component unmount
    return () => {
      console.log("Chats component unmounting, disconnecting socket.");
      disconnectSocket();
      resetChatState(); // Reset chat state on unmount too
    };
  }, [resetChatState]); // resetChatState is stable

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        console.log(
          "[Visibility Effect] App became visible. Re-fetching channels..."
        );
        // Check if socket is connected before fetching
        const socket = getSocket();
        if (socket?.connected) {
          fetchChannels(); // Call the existing function
        } else {
          console.log(
            "[Visibility Effect] Socket not connected, skipping channel fetch."
          );
          // Optional: Trigger reconnection logic if needed here
        }
      }
    };

    // Add listener
    document.addEventListener("visibilitychange", handleVisibilityChange);
    console.log("[Visibility Effect] Listener added.");

    // Cleanup listener on component unmount
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      console.log("[Visibility Effect] Listener removed.");
    };
  }, []);

  // --- Render Logic ---

  // 1. Show loader if waiting for token OR loading user OR connecting socket initially
  if (!storedToken || isUserLoading || (connectionAttempted && isConnecting)) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">
          {!storedToken
            ? "Waiting for auth..."
            : isUserLoading
            ? "Loading user..."
            : "Connecting to chat..."}
        </p>
      </div>
    );
  }

  // 2. Show error if token exists but user fetch failed OR socket connection failed
  if (connectionError || (storedToken && !user && !isUserLoading)) {
    // Added !isUserLoading check
    const errorMessage = connectionError
      ? `Connection Failed: ${connectionError}`
      : "Authentication failed: Could not load user details.";
    return (
      <div className="flex flex-col h-full items-center justify-center text-center p-4">
        <p className="text-destructive font-semibold mb-2">Chat Unavailable</p>
        <p className="text-muted-foreground text-sm mb-4">{errorMessage}</p>
        <Button
          onClick={() => {
            console.log("Retry button clicked.");
            setConnectionError(null);
            setIsConnecting(false);
            connectingRef.current = false;
            setIsUserLoading(false);
            setConnectionAttempted(false); // Reset flag to allow re-attempt
            // The Auth+Socket useEffect should trigger again if token exists
            if (getSocket() && !getSocket().connected) disconnectSocket(); // Disconnect if needed
          }}
        >
          Retry
        </Button>
        <Button
          variant="link"
          size="sm"
          className="mt-2"
          onClick={() => {
            logout();
            resetChatState();
            navigate("/");
          }}
        >
          Logout
        </Button>
      </div>
    );
  }

  // 3. Show Reconnecting state if connection was attempted, no error, user exists, but socket isn't currently connected
  if (
    connectionAttempted &&
    !connectionError &&
    user &&
    !getSocket()?.connected
  ) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        <p className="ml-2 text-orange-600">Reconnecting...</p>
      </div>
    );
  }

  // 4. Show main chat UI ONLY if token exists, user is loaded, connection attempt made, no error, and socket is connected
  if (
    storedToken &&
    user &&
    connectionAttempted &&
    !connectionError &&
    getSocket()?.connected
  ) {
    return (
      <Card
        className="bg-background rounded-2xl h-full w-full flex flex-col overflow-hidden"
        data-safe-focus
        tabIndex="0"
        id="chat-card-container"
      >
        {/* --- Drawers --- */}
        <Drawer open={isCreateChatOpen} onOpenChange={setIsCreateChatOpen}>
          {/* ... DrawerContent for CreateChatView ... */}
          <DrawerContent className="h-[85%] sm:h-[70%]">
            <div className="flex flex-col h-full w-full max-w-xl mx-auto">
              <DrawerHeader className="flex-shrink-0">
                {" "}
                <DrawerTitle>Start New Chat</DrawerTitle>{" "}
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
        <Drawer open={isContactInfoOpen} onOpenChange={setIsContactInfoOpen}>
          {/* ... DrawerContent for ContactInfoView ... */}
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
        <Drawer open={isMessageInfoOpen} onOpenChange={setIsMessageInfoOpen}>
          {/* ... DrawerContent for MessageInfoView ... */}
          <DrawerContent className="h-auto max-h-[50%]">
            <div className="flex flex-col h-full w-full max-w-md mx-auto p-4">
              <DrawerHeader className="p-0 mb-4 text-left">
                {" "}
                <DrawerTitle>Message Info</DrawerTitle>{" "}
              </DrawerHeader>
              {viewingMessageData && (
                <MessageInfoView message={viewingMessageData} />
              )}
            </div>
          </DrawerContent>
        </Drawer>

        {/* --- Main Grid Layout for Chat --- */}
        <div className="flex-1 flex overflow-hidden">
          {/* Chat List Pane */}
          <div
            className={cn(
              "w-full md:w-[300px] lg:w-[340px]",
              "h-full flex-shrink-0",
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

          {/* Chat Window Pane */}
          <div
            className={cn(
              "h-full flex-1 min-w-0",
              showChatList ? "hidden md:block" : "block"
            )}
          >
            {activeChannelId ? (
              <ChatWindow
                channelId={activeChannelId}
                onBack={handleBackToList}
                onViewContactInfo={handleViewContactInfo}
                onViewMessageInfo={handleViewMessageInfo}
              />
            ) : (
              <div className="flex flex-col h-full items-center justify-center text-muted-foreground bg-muted/20">
                <p>Select a chat to start messaging</p>
              </div>
            )}
          </div>
        </div>

        {/* --- Toaster --- */}
        <Toaster position="top-right" richColors />
      </Card>
    );
  }

  // Fallback if none of the above states match (should be rare)
  return (
    <div className="flex h-full items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      <p className="ml-2 text-muted-foreground">Initializing...</p>
    </div>
  );
};

export default Chats;
