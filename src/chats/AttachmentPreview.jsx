// components/chats/AttachmentPreview.jsx
import React, { useEffect } from "react"; // Added useEffect for potential cleanup later if needed
import { Image as ImageIcon, FileText, Video, Music } from "lucide-react"; // Removed ExternalLink as it wasn't used

// Function to determine file type category (simple example)
const getFileType = (mimeType = "", fileName = "") => {
  // Added default empty string for safety
  if (!mimeType) return "file"; // Default if mime is missing
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  if (mimeType === "application/pdf") return "pdf";
  // Add more specific types if needed (e.g., based on file extension as fallback)
  // const extension = fileName.split('.').pop()?.toLowerCase();
  // if (['doc', 'docx'].includes(extension)) return 'doc';
  return "file"; // Default
};

// Function to construct the full URL (Seems OK, assumes backend provides full URLs)
const getFullUrl = (url) => {
  if (!url) return "";
  // Your backend URL is already absolute, so this function is simpler now
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  // Keep the warning and fallback for relative paths just in case
  console.warn(
    `Attachment URL "${url}" might be relative, but no base URL configured. Attempting to use as is.`
  );
  // Optionally prepend default base URL if needed
  // const baseUrl = import.meta.env.VITE_PHP_ASSET_BASE_URL;
  // if (baseUrl) return `${baseUrl.replace(/\/$/, "")}/${url.replace(/^\//, "")}`;
  return url; // Return as is if not absolute and no base URL
};

const AttachmentPreview = ({ attachment }) => {
  // console.log("Attachment prop received:", attachment); // Log the raw prop

  if (!attachment || typeof attachment !== "object") return null; // Basic validation

  // ----- FIX: Use correct keys from the attachment object -----
  const {
    url, // Use 'url' instead of 'file_url'
    mime, // Use 'mime' instead of 'mime_type'
    name, // Use 'name' instead of 'file_name'
    size, // Use 'size' instead of 'file_size' (optional for display)
  } = attachment;
  // ----- END FIX -----

  // Derive type and full URL using the correct variables
  const type = getFileType(mime, name); // Pass correct mime and name
  const fullFileUrl = getFullUrl(url); // Pass correct url

  // Optional: Format file size
  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };
  const formattedSize = formatFileSize(size); // Use the correct 'size' variable

  // Handle potential missing URL
  if (!fullFileUrl) {
    console.warn("AttachmentPreview: Missing URL for attachment:", attachment);
    return (
      <div className="flex items-center p-2 text-xs text-destructive border rounded border-destructive bg-destructive/10 max-w-[250px]">
        <FileText className="h-4 w-4 mr-2 flex-shrink-0" />
        <span>Attachment unavailable (Missing URL)</span>
      </div>
    );
  }

  const renderPreview = () => {
    switch (type) {
      case "image":
        return (
          // Ensure clicking the preview opens the image in a new tab
          <a
            href={fullFileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block max-w-[250px] max-h-[250px] overflow-hidden rounded cursor-pointer group relative bg-muted" // Added background placeholder
            title={`View image: ${name}`} // Add title
          >
            <img
              src={fullFileUrl}
              alt={name || "Image attachment"} // Use correct 'name'
              className="object-contain w-full h-full transition-opacity duration-300 ease-in-out"
              // Optional: Add loading state indicator
              onLoad={(e) => (e.currentTarget.style.opacity = "1")}
              onError={(e) => {
                e.currentTarget.style.opacity = "0.5"; // Indicate error visually
                console.error(`Failed to load image: ${fullFileUrl}`);
                // Optionally replace src with a placeholder error image
              }}
              style={{ opacity: 0 }} // Start transparent, fade in on load
            />
            {/* Optional: Add overlay on hover */}
            {/* <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center justify-center">
                 <ExternalLink className="w-6 h-6 text-white" />
             </div> */}
          </a>
        );
      case "video":
        return (
          <div className="flex items-center p-2 bg-muted rounded border max-w-[250px]">
            <Video className="h-8 w-8 mr-2 text-primary flex-shrink-0" />
            <div className="overflow-hidden">
              <p className="text-sm font-medium truncate" title={name}>
                {" "}
                {/* Add title */}
                {name || "Video File"} {/* Use correct 'name' */}
              </p>
              {/* Display size */}
              <p className="text-xs text-muted-foreground">{formattedSize}</p>
              <a
                href={fullFileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:underline truncate block mt-1"
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
              <p className="text-sm font-medium truncate" title={name}>
                {" "}
                {/* Add title */}
                {name || "Audio File"} {/* Use correct 'name' */}
              </p>
              <p className="text-xs text-muted-foreground">{formattedSize}</p>
              {/* Consider embedding <audio controls> for better UX */}
              <a
                href={fullFileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:underline truncate block mt-1"
              >
                Play Audio
              </a>
            </div>
          </div>
        );
      case "pdf":
        return (
          <div className="flex items-center p-2 bg-muted rounded border max-w-[250px]">
            <FileText className="h-8 w-8 mr-2 text-red-600 flex-shrink-0" />
            <div className="overflow-hidden">
              <p className="text-sm font-medium truncate" title={name}>
                {" "}
                {/* Add title */}
                {name || "PDF Document"} {/* Use correct 'name' */}
              </p>
              <p className="text-xs text-muted-foreground">{formattedSize}</p>
              <a
                href={fullFileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:underline truncate block mt-1"
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
              <p className="text-sm font-medium truncate" title={name}>
                {" "}
                {/* Add title */}
                {name || "File Attachment"} {/* Use correct 'name' */}
              </p>
              <p className="text-xs text-muted-foreground">{formattedSize}</p>
              <a
                href={fullFileUrl}
                download={name || "download"} // Use correct 'name' for download attribute
                className="text-xs text-blue-600 hover:underline truncate block mt-1"
              >
                Download File
              </a>
            </div>
          </div>
        );
    }
  };

  return <div className="attachment-preview mt-1">{renderPreview()}</div>; // Add margin if needed
};

export default AttachmentPreview;
