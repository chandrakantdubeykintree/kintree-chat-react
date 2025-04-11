import { useState } from "react";

export default function PDFViewer({ url }) {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className="relative w-full h-full">
      {/* Loading Shimmer */}
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}

      <iframe
        src={url}
        className="w-full h-full"
        title="PDF Viewer"
        onLoad={() => setIsLoading(false)}
        // sandbox="allow-scripts allow-same-origin allow-forms"
      />
    </div>
  );
}
