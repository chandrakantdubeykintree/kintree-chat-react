// components/chats/AttachmentPreview.jsx
import React from "react";
import {
  Image as ImageIcon,
  FileText,
  Video,
  Music,
  ExternalLink,
} from "lucide-react";

// Function to determine file type category (simple example)
const getFileType = (mimeType, fileName = "") => {
  if (!mimeType) mimeType = "";
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  if (mimeType === "application/pdf") return "pdf";
  // Add more specific types if needed
  return "file"; // Default
};

// Function to construct the full URL if backend provides relative path
// This might need adjustment based on your PHP backend's response
const getFullUrl = (url) => {
  if (!url) return "";
  // If URL is already absolute, return it
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  // Otherwise, prepend the PHP backend base URL (without /api typically for assets)
  const baseUrl =
    import.meta.env.VITE_PHP_ASSET_BASE_URL ||
    import.meta.env.VITE_PHP_BACKEND_URL?.replace("/api", "");
  if (!baseUrl) {
    console.warn(
      "VITE_PHP_ASSET_BASE_URL or VITE_PHP_BACKEND_URL not configured for relative asset paths."
    );
    return url; // Return relative path as fallback
  }
  // Ensure no double slashes
  return `${baseUrl.replace(/\/$/, "")}/${url.replace(/^\//, "")}`;
};

const AttachmentPreview = ({ attachment }) => {
  if (!attachment) return null;

  const { file_url, mime_type, file_name, file_size } = attachment; // Adjust keys based on your PHP response
  const type = getFileType(mime_type, file_name);
  const fullFileUrl = getFullUrl(file_url);

  const renderPreview = () => {
    switch (type) {
      case "image":
        return (
          <a
            href={fullFileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block max-w-[250px] max-h-[250px] overflow-hidden rounded cursor-pointer"
          >
            <img
              src={fullFileUrl}
              alt={file_name || "Image attachment"}
              className="object-contain w-full h-full"
            />
          </a>
        );
      case "video":
        return (
          <div className="flex items-center p-2 bg-muted rounded border max-w-[250px]">
            <Video className="h-8 w-8 mr-2 text-primary flex-shrink-0" />
            <div className="overflow-hidden">
              <p className="text-sm font-medium truncate">
                {file_name || "Video File"}
              </p>
              <a
                href={fullFileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:underline truncate block"
              >
                View Video
              </a>
            </div>
          </div>
        );
      case "audio":
        return (
          <div className="flex items-center p-2 bg-muted rounded border max-w-[250px]">
            <Music className="h-8 w-8 mr-2 text-primary flex-shrink-0" />
            <div className="overflow-hidden">
              <p className="text-sm font-medium truncate">
                {file_name || "Audio File"}
              </p>
              <a
                href={fullFileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:underline truncate block"
              >
                Play Audio
              </a>
              {/* Could potentially embed <audio> controls */}
            </div>
          </div>
        );
      case "pdf":
        return (
          <div className="flex items-center p-2 bg-muted rounded border max-w-[250px]">
            <FileText className="h-8 w-8 mr-2 text-red-600 flex-shrink-0" />
            <div className="overflow-hidden">
              <p className="text-sm font-medium truncate">
                {file_name || "PDF Document"}
              </p>
              <a
                href={fullFileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:underline truncate block"
              >
                View PDF
              </a>
            </div>
          </div>
        );
      default: // Generic file
        return (
          <div className="flex items-center p-2 bg-muted rounded border max-w-[250px]">
            <FileText className="h-8 w-8 mr-2 text-muted-foreground flex-shrink-0" />
            <div className="overflow-hidden">
              <p className="text-sm font-medium truncate">
                {file_name || "File Attachment"}
              </p>
              <a
                href={fullFileUrl}
                download={file_name || "download"}
                className="text-xs text-blue-600 hover:underline truncate block"
              >
                Download File
              </a>
            </div>
          </div>
        );
    }
  };

  return <div className="attachment-preview">{renderPreview()}</div>;
};

export default AttachmentPreview;
