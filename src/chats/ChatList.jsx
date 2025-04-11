// frontend/src/components/ChatList.jsx
import React from "react";
import useChatStore from "./useChatStore";
import ChatListItem from "./ChatListItem";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MessageSquarePlus, Loader2 } from "lucide-react"; // Icons
import { Skeleton } from "@/components/ui/skeleton"; // For loading state

const ChatList = ({ onSelectChat, onInitiateCreateChat }) => {
  const { channels, loadingChannels, channelError, activeChannelId } =
    useChatStore();
  const [searchTerm, setSearchTerm] = React.useState("");

  const filteredChannels = channels.filter((channel) =>
    channel.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateChatClick = () => {
    if (onInitiateCreateChat) {
      onInitiateCreateChat();
    } else {
      console.warn("onInitiateCreateChat prop not provided to ChatList");
    }
  };

  return (
    <div className="flex flex-col h-full border-r bg-background">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Chats</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCreateChatClick}
            title="New Chat"
          >
            <MessageSquarePlus className="h-5 w-5" />
          </Button>
        </div>
        <Input
          type="search"
          placeholder="Search chats..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Chat List Area */}
      <ScrollArea className="flex-1">
        {!loadingChannels &&
          !channelError &&
          filteredChannels.length === 0 &&
          channels.length > 0 && (
            <div className="p-4 text-center text-muted-foreground">
              No matching chats found.
            </div>
          )}
        {!loadingChannels && !channelError && channels.length === 0 && (
          <div className="p-4 text-center text-muted-foreground flex flex-col items-center">
            <span>No chats yet.</span>
            <Button
              variant="link"
              onClick={handleCreateChatClick}
              className="mt-1"
            >
              Start a new conversation!
            </Button>
          </div>
        )}
        {loadingChannels && (
          <div className="p-4 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}
        {!loadingChannels && channelError && (
          <div className="p-4 text-center text-destructive">
            Error loading chats: {channelError}
          </div>
        )}
        {!loadingChannels && !channelError && filteredChannels.length === 0 && (
          <div className="p-4 text-center text-muted-foreground">
            {channels.length === 0
              ? "No chats yet. Start a new conversation!"
              : "No matching chats found."}
          </div>
        )}
        {!loadingChannels &&
          !channelError &&
          filteredChannels.map((channel) => (
            <ChatListItem
              key={channel.id}
              channel={channel}
              isActive={channel.id === activeChannelId}
              onClick={() => onSelectChat(channel.id)}
            />
          ))}
      </ScrollArea>
    </div>
  );
};

export default ChatList;
