// frontend/src/components/CreateChatView.jsx
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog"; // Use if using Dialog wrapper
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
  DrawerTrigger,
  DrawerFooter,
  DrawerDescription,
} from "@/components/ui/drawer"; // Use if using Drawer wrapper
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, X, ArrowLeft, UserPlus } from "lucide-react";
import { fetchFamilyMembers } from "@/chats/apiService"; // Adjust path
import { emitCreateChannel } from "@/chats/socketService"; // Adjust path
import useAuthStore from "@/chats/useAuthStore"; // Adjust path
import MemberListItem from "./MemberListItem"; // Adjust path
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton"; // For loading state

// Decide whether this component is rendered inside a Dialog or Drawer externally
// or if it includes the Dialog/Drawer itself. Let's assume it's rendered inside.
const CreateChatView = ({ onClose, onChannelCreated }) => {
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [memberError, setMemberError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [creatingChannelWith, setCreatingChannelWith] = useState(null); // Store ID of user being created with

  const token = useAuthStore((state) => state.token);

  useEffect(() => {
    const loadMembers = async () => {
      if (!token) {
        setMemberError("Authentication token not found.");
        setLoadingMembers(false);
        return;
      }
      setLoadingMembers(true);
      setMemberError(null);
      try {
        const fetchedMembers = await fetchFamilyMembers(token);
        setMembers(fetchedMembers);
      } catch (error) {
        console.error("Failed to load members:", error);
        setMemberError(error.message || "Could not load members.");
      } finally {
        setLoadingMembers(false);
      }
    };
    loadMembers();
  }, [token]);

  const handleMemberSelect = async (member) => {
    if (creatingChannelWith) return; // Prevent double clicks

    setCreatingChannelWith(member.id);
    console.log(`Attempting to create/find channel with user ID: ${member.id}`);

    try {
      // emitCreateChannel expects only the *other* user's ID for 1-on-1
      const channelData = await emitCreateChannel(member.id);
      toast.success(`Chat with ${member.first_name} started!`);
      onChannelCreated(channelData); // Pass channel data back to parent
      onClose(); // Close the view/dialog
    } catch (error) {
      console.error("Failed to create channel:", error);
      toast.error(`Error: ${error.message || "Could not start chat."}`);
      setCreatingChannelWith(null); // Reset loading state on error
    }
    // No finally here, keep loading state until success/error shown and view closed
  };

  const filteredMembers = members.filter((member) => {
    const fullName = `${member.first_name || ""} ${
      member.last_name || ""
    }`.toLowerCase();
    const relation = member.relation?.toLowerCase() || "";
    const search = searchTerm.toLowerCase();
    return fullName.includes(search) || relation.includes(search);
  });

  const renderContent = () => {
    if (loadingMembers) {
      return (
        <div className="space-y-3 p-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center space-x-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (memberError) {
      return (
        <p className="p-4 text-center text-destructive">Error: {memberError}</p>
      );
    }

    if (filteredMembers.length === 0) {
      return (
        <p className="p-4 text-center text-muted-foreground">
          {searchTerm
            ? "No matching members found."
            : "No active members found to chat with."}
        </p>
      );
    }

    return (
      <ScrollArea className="flex-1 px-2">
        {" "}
        {/* Added px-2 */}
        <div className="space-y-1 py-2">
          {" "}
          {/* Added py-2 */}
          {filteredMembers.map((member) => (
            <MemberListItem
              key={member.id}
              member={member}
              onClick={handleMemberSelect}
              disabled={creatingChannelWith === member.id} // Disable item being processed
            />
          ))}
        </div>
      </ScrollArea>
    );
  };

  return (
    // This structure assumes rendering inside DrawerContent or DialogContent
    // The parent component (`Chats.jsx`) will provide the Drawer/Dialog wrapper
    <div className="flex flex-col h-full">
      {" "}
      {/* Occupy full height of Drawer/Dialog */}
      {/* Header - Placed inside DrawerHeader/DialogHeader by parent */}
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold">Start New Chat</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>
      {/* Search Input */}
      <div className="p-3 border-b">
        <Input
          type="search"
          placeholder="Search members..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          disabled={loadingMembers || creatingChannelWith !== null}
        />
      </div>
      {/* Member List Area */}
      {renderContent()}
    </div>
  );
};

export default CreateChatView;
