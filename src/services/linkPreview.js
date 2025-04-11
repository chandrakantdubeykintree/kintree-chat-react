// import { getLinkPreview } from "link-preview-js";

import axios from "axios";

export async function fetchLinkPreview(url) {
  try {
    const response = await axios.get(
      `https://api.microlink.io/?url=${encodeURIComponent(url)}`
    );

    const { data } = response.data;

    return {
      title: data.title || "No title available",
      description: data.description || "",
      image: data.image?.url || "",
      url: url,
      siteName: data.publisher || new URL(url).hostname,
    };
  } catch (error) {
    console.error("Link preview fetch error:", error);
    return createFallbackPreview(url);
  }
}

export function createFallbackPreview(url) {
  try {
    const domain = new URL(url).hostname.replace("www.", "");
    return {
      title: domain,
      description: "",
      image: "",
      url: url,
      siteName: domain,
      isError: true,
    };
  } catch (e) {
    return {
      title: "Link Preview",
      description: "",
      image: "",
      url: url,
      siteName: "Unknown",
      isError: true,
    };
  }
}
