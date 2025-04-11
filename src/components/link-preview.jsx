import { useState, useEffect } from "react";
import {
  createFallbackPreview,
  fetchLinkPreview,
} from "@/services/linkPreview";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, Globe, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const LinkPreview = ({ url, className }) => {
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);

  const getInitial = (siteName) => {
    return siteName?.charAt(0)?.toUpperCase() || "L";
  };

  const getColorByDomain = (domain = "") => {
    const colors = {
      "clickup.com": "bg-[#7B68EE] text-white",
      "amazon.com": "bg-[#FF9900] text-white",
      "amzn.in": "bg-[#FF9900] text-white",
      "maps.google.com": "bg-[#4285F4] text-white",
      default: "bg-gradient-to-br from-gray-100 to-gray-200 text-gray-700",
    };

    const domainKey = Object.keys(colors).find((key) => domain.includes(key));
    return colors[domainKey] || colors.default;
  };

  useEffect(() => {
    let mounted = true;

    const loadPreview = async () => {
      try {
        setLoading(true);
        const data = await fetchLinkPreview(url);

        if (mounted) {
          setPreview(data);
        }
      } catch (error) {
        if (mounted) {
          setPreview(createFallbackPreview(url));
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    if (url) {
      loadPreview();
    }

    return () => {
      mounted = false;
    };
  }, [url]);

  if (loading) {
    return (
      <div
        className={cn(
          "flex items-center space-x-4 p-4 border rounded-lg bg-card",
          className
        )}
      >
        <Skeleton className="h-24 w-24 rounded-md" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-[250px]" />
          <Skeleton className="h-4 w-[200px]" />
        </div>
      </div>
    );
  }

  const domain = preview?.siteName || new URL(url).hostname;
  const colorClass = getColorByDomain(domain.toLowerCase());

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "group flex overflow-hidden rounded-lg border bg-card hover:bg-accent/50 transition-all duration-300",
        className
      )}
    >
      <div
        className={cn(
          "flex aspect-square w-24 flex-shrink-0 items-center justify-center sm:w-32",
          colorClass,
          "transition-all duration-300"
        )}
      >
        {preview?.isError ? (
          // <Globe className="h-8 w-8" />
          <span className="text-3xl font-semibold">{getInitial(domain)}</span>
        ) : (
          <img
            src={preview?.image}
            className="object-contain max-w-[100%] max-h-[100]"
          />
        )}
      </div>

      <div className="flex flex-1 flex-col justify-between p-4">
        <div className="space-y-1">
          <h3 className="font-medium leading-tight text-foreground line-clamp-2">
            {preview?.title || domain}
          </h3>
          {preview?.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {preview.description}
            </p>
          )}
        </div>
        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
          <Globe className="h-3 w-3" />
          <span>{domain}</span>
          <ExternalLink className="h-3 w-3" />
        </div>
      </div>
    </a>
  );
};

export default LinkPreview;
