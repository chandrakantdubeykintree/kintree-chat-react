// src/components/chats/MemberListItem.jsx
import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"; // Adjust path
import { cn } from "@/lib/utils"; // Adjust path

const MemberListItem = ({ member, onClick, disabled = false }) => {
  const fallback = member.first_name
    ? member.first_name.substring(0, 1).toUpperCase()
    : "?";
  const fullName = `${member.first_name || ""} ${
    member.last_name || ""
  }`.trim();

  return (
    <div
      className={cn(
        "flex items-center p-3 hover:bg-muted rounded-md",
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
      )}
      onClick={!disabled ? () => onClick(member) : undefined}
    >
      <Avatar className="h-10 w-10 mr-3">
        <AvatarImage src={member.profile_pic_url} alt={fullName} />
        <AvatarFallback>{fallback}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate">{fullName}</p>
        {member.relation && (
          <p className="text-xs text-muted-foreground truncate">
            {member.relation}
          </p>
        )}
      </div>
      {/* Optionally show a checkmark or loading indicator during creation */}
    </div>
  );
};

export default MemberListItem;
