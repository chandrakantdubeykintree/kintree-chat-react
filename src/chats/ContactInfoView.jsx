// components/ContactInfoView.jsx
import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { BellOff, Phone, UserX, Trash2, LogOut, UserPlus } from "lucide-react"; // Icons
import { formatDistanceToNowStrict } from "date-fns";

// TODO: Fetch members for group info if needed
// import { fetchChannelMembers } from '@/services/apiService';

const ContactInfoView = ({ channel }) => {
  if (!channel) return null;

  const fallback = channel.name
    ? channel.name.substring(0, 1).toUpperCase()
    : "?";
  const isGroup = channel.is_group === 1;

  // TODO: Replace with actual last seen data
  const lastSeen = channel.is_online
    ? "Online"
    : channel.last_seen_at
    ? `Last seen ${formatDistanceToNowStrict(new Date(channel.last_seen_at), {
        addSuffix: true,
      })}`
    : "Offline";

  const handleDeleteChat = () => {
    /* TODO: Implement using emitDeleteChannel */ toast.info(
      "Delete chat not implemented"
    );
  };
  const handleClearChat = () => {
    /* TODO: Implement using emitClearChat */ toast.info(
      "Clear chat not implemented"
    );
  };
  const handleBlockContact = () => {
    /* TODO: Implement block logic */ toast.info(
      "Block contact not implemented"
    );
  };
  const handleLeaveGroup = () => {
    /* TODO: Implement leave group logic */ toast.info(
      "Leave group not implemented"
    );
  };
  const handleAddParticipant = () => {
    /* TODO: Implement add participant logic */ toast.info(
      "Add participant not implemented"
    );
  };

  return (
    <div className="p-4 space-y-6">
      {/* Header Section */}
      <div className="flex flex-col items-center space-y-3">
        <Avatar className="h-24 w-24">
          <AvatarImage src={channel.thumbnail_image_url} alt={channel.name} />
          <AvatarFallback className="text-4xl">{fallback}</AvatarFallback>
        </Avatar>
        <div className="text-center">
          <h2 className="text-xl font-semibold">{channel.name}</h2>
          {!isGroup && (
            <p className="text-sm text-muted-foreground">{lastSeen}</p>
          )}
          {isGroup && (
            <p className="text-sm text-muted-foreground">
              Group - TODO: X participants
            </p>
          )}
        </div>
        {channel.description && (
          <p className="text-sm text-muted-foreground text-center">
            {channel.description}
          </p>
        )}
      </div>

      <Separator />

      {/* TODO: Media, Links, Docs Section */}
      {/* <div> ... </div> */}

      {isGroup && (
        <>
          {/* TODO: List Participants */}
          <div>
            <h3 className="text-sm font-medium mb-2">Participants</h3>
            {/* <ScrollArea className="h-40"> ... ParticipantListItems ... </ScrollArea> */}
            <Button
              variant="outline"
              className="w-full mt-2"
              onClick={handleAddParticipant}
            >
              <UserPlus className="mr-2 h-4 w-4" /> Add Participant
            </Button>
          </div>
          <Separator />
        </>
      )}

      {/* Actions */}
      <div className="space-y-2">
        {/* <Button variant="ghost" className="w-full justify-start text-muted-foreground"> <BellOff className="mr-2 h-4 w-4" /> Mute Notifications </Button> */}
        {!isGroup && (
          <Button
            variant="ghost"
            className="w-full justify-start text-destructive"
            onClick={handleBlockContact}
          >
            {" "}
            <UserX className="mr-2 h-4 w-4" /> Block Contact{" "}
          </Button>
        )}
        <Button
          variant="ghost"
          className="w-full justify-start text-destructive"
          onClick={handleClearChat}
        >
          {" "}
          <Trash2 className="mr-2 h-4 w-4" /> Clear Chat{" "}
        </Button>
        {isGroup && (
          <Button
            variant="ghost"
            className="w-full justify-start text-destructive"
            onClick={handleLeaveGroup}
          >
            {" "}
            <LogOut className="mr-2 h-4 w-4" /> Leave Group{" "}
          </Button>
        )}
        {!isGroup && (
          <Button
            variant="ghost"
            className="w-full justify-start text-destructive"
            onClick={handleDeleteChat}
          >
            {" "}
            <UserX className="mr-2 h-4 w-4" /> Delete Chat{" "}
          </Button>
        )}
      </div>
    </div>
  );
};

export default ContactInfoView;
