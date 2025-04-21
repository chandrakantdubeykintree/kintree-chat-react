// src/components/chats/MessageInput.jsx
import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Edit3,
  Loader2,
  Paperclip,
  SendHorizonal,
  Smile,
  X,
} from "lucide-react"; // Added X for cancel edit
import { cn } from "@/lib/utils";
import { emitStartTyping, emitStopTyping } from "@/chats/socketService"; // Import emitters
import { useDebouncedCallback } from "use-debounce";

const MessageInput = ({
  channelId,
  onSendMessage,
  editingMessage, // { id, message }
  onCancelEdit,
  onAttachmentSelected, // Callback with the File object
  isSending, // Disable input/buttons while sending/uploading
}) => {
  const [message, setMessage] = useState("");
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null); // Ref for the hidden file input
  const typingTimeoutRef = useRef(null); // Ref to store typing timeout

  // Effect to update input when editingMessage changes
  useEffect(() => {
    if (editingMessage) {
      setMessage(editingMessage.message);
      textareaRef.current?.focus();
      // Adjust height for existing text
      handleInputChange({ target: { value: editingMessage.message } });
    } else {
      setMessage(""); // Clear input when not editing
    }
  }, [editingMessage]);

  const handleSend = () => {
    const trimmedMessage = message.trim();
    // Allow sending edit even if text is empty (might just remove text)
    if (trimmedMessage || editingMessage) {
      onSendMessage(channelId, trimmedMessage, null); // Pass null for attachment_id (handled separately)
      // Clear local state only if NOT editing (ChatWindow handles clearing editing state)
      if (!editingMessage) {
        setMessage("");
        // Reset textarea height
        if (textareaRef.current) textareaRef.current.style.height = "auto";
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    } else if (e.key === "Escape" && editingMessage) {
      // Cancel edit on Escape key
      onCancelEdit();
    }
  };

  // Debounced function to emit stopTyping
  const debouncedStopTyping = useDebouncedCallback(() => {
    emitStopTyping(channelId);
  }, 1500); // Emit stop typing after 1.5 seconds of inactivity

  const handleTyping = () => {
    emitStartTyping(channelId);
    // Debounce the stop typing event
    debouncedStopTyping();
  };

  const handleInputChange = (e) => {
    setMessage(e.target.value);
    // Auto-resize textarea
    handleTyping(); // Trigger typing logic on input change
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      const scrollHeight = textarea.scrollHeight;
      // Consider max-height defined in CSS (e.g., max-h-40 translates roughly to 10rem or 160px)
      const maxHeight = 160;
      textarea.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
      textarea.style.overflowY = scrollHeight > maxHeight ? "auto" : "hidden";
    }
  };

  const handleAttachClick = () => {
    fileInputRef.current?.click(); // Trigger hidden file input
  };

  const handleFileSelected = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onAttachmentSelected(file); // Pass the file object up
    }
    // Reset file input value so selecting the same file again triggers onChange
    e.target.value = "";
  };

  // --- Cleanup ---
  // Ensure stopTyping is emitted if component unmounts or channelId changes while typing
  useEffect(() => {
    return () => {
      // If the component unmounts, cancel any pending stop typing event and emit immediately
      debouncedStopTyping.cancel(); // Cancel pending debounced call
      emitStopTyping(channelId);
    };
  }, [channelId, debouncedStopTyping]); // Rerun effect if channelId changes

  return (
    <div className="p-3 border-t bg-background relative">
      {" "}
      {/* Reduced padding */}
      {/* Editing Indicator */}
      {editingMessage && (
        <div className="flex items-center justify-between text-sm px-1 pb-1 border-b mb-2">
          <div className="flex items-center text-primary font-medium">
            <Edit3 className="h-4 w-4 mr-1" />
            Editing message...
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onCancelEdit}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelected}
        className="hidden"
        // Define acceptable file types (example)
        accept="image/*,application/pdf,video/*,.doc,.docx,.xls,.xlsx"
      />
      <div className="flex items-end space-x-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleAttachClick}
          disabled={isSending}
        >
          <Paperclip className="h-5 w-5" />
        </Button>
        {/* <Button variant="ghost" size="icon" disabled={isSending}>
                     <Smile className="h-5 w-5" />
                 </Button> */}
        <Textarea
          ref={textareaRef}
          placeholder="Type a message..."
          value={message}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          rows={1}
          className="flex-1 resize-none max-h-40 min-h-[40px] overflow-y-hidden text-sm" // Added text-sm
          disabled={isSending} // Disable textarea while sending
        />
        <Button
          onClick={handleSend}
          disabled={(!message.trim() && !editingMessage) || isSending}
          size="icon"
        >
          {isSending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <SendHorizonal className="h-5 w-5" />
          )}
        </Button>
      </div>
    </div>
  );
};

export default MessageInput;
