// src/components/chats/AttachmentInputPreview.jsx
import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  X,
  Paperclip,
  FileText,
  Image as ImageIcon,
  Video,
  Music,
} from "lucide-react";

// Basic type detection (can be expanded)
const getFileType = (mimeType = "") => {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  if (mimeType === "application/pdf") return "pdf";
  return "file";
};

const AttachmentInputPreview = ({ attachmentPreview, onRemove }) => {
  if (!attachmentPreview) return null;

  const { file, data } = attachmentPreview; // file is the original File, data is server response
  const fileName = file?.name || data?.file_name || "Attachment";
  const fileSize = file?.size; // Can format this later
  const mimeType = file?.type || data?.mime_type;
  const fileType = getFileType(mimeType);
  const objectURL =
    file && fileType === "image" ? URL.createObjectURL(file) : null; // Create local URL for image preview

  // Clean up object URL when component unmounts or file changes
  useEffect(() => {
    return () => {
      if (objectURL) {
        URL.revokeObjectURL(objectURL);
      }
    };
  }, [objectURL]);

  const renderIconAndInfo = () => {
    let icon = (
      <FileText className="h-6 w-6 text-muted-foreground flex-shrink-0" />
    );
    if (fileType === "image" && objectURL) {
      return (
        <div className="flex items-center space-x-2 overflow-hidden">
          <img
            src={objectURL}
            alt="Preview"
            className="h-10 w-10 object-cover rounded flex-shrink-0"
          />
          <span className="text-sm font-medium text-foreground truncate flex-1 min-w-0">
            {fileName}
          </span>
        </div>
      );
    }
    if (fileType === "video")
      icon = <Video className="h-6 w-6 text-muted-foreground flex-shrink-0" />;
    if (fileType === "audio")
      icon = <Music className="h-6 w-6 text-muted-foreground flex-shrink-0" />;
    // Add more specific icons if needed

    return (
      <div className="flex items-center space-x-2 overflow-hidden">
        {icon}
        <span className="text-sm font-medium text-foreground truncate flex-1 min-w-0">
          {fileName}
        </span>
      </div>
    );
  };

  return (
    <div className="p-2 px-3 border-b bg-muted/50 flex items-center justify-between">
      <div className="flex-1 min-w-0 pr-2">{renderIconAndInfo()}</div>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 flex-shrink-0"
        onClick={onRemove}
        title="Remove attachment"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default AttachmentInputPreview;
