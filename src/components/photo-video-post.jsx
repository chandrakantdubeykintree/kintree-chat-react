import AsyncComponent from "./async-component";
import { CardContent } from "./ui/card";
import LinkPreview from "./link-preview";

import { useState } from "react";
import PhotoVideoCarousel from "./photo-video-carousel";
import { useTranslation } from "react-i18next";
import { ZoomIn } from "lucide-react";

export default function PhotoVideoPost({ post }) {
  const { t } = useTranslation();
  const {
    id,
    privacy,
    post_data,
    author_details,
    reactions,
    user_reaction,
    comment_counts,
    created_at,
    updated_at,
  } = post;
  const [viewPostAttachmentModal, setViewPostAttachmentModal] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const renderText = (text) => {
    if (!text) return null;

    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls = text.match(urlRegex) || [];

    // Separate text content from URLs
    const textContent = text.replace(urlRegex, "").trim();

    const renderTextContent = (content) => {
      if (content.length < 150) {
        return <div className="mb-4 pt-4 px-4">{content}</div>;
      }

      let truncatedText = content.substring(0, 150);
      truncatedText = truncatedText.substring(
        0,
        truncatedText.lastIndexOf(" "),
      );

      return (
        <div className="mb-4 pt-4 px-4">
          <div className="text-md font-normal transition-all duration-300 ease-in-out">
            {isExpanded ? content : truncatedText + "..."}
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-brandPrimary hover:text-brandPrimary/80 text-sm font-medium mt-2 transition-colors duration-200"
          >
            {isExpanded ? t("see_less") : t("see_more")}
          </button>
        </div>
      );
    };

    return (
      <>
        {/* Render main text content */}
        {renderTextContent(textContent)}

        {/* Render attachments if any */}
        {renderAttachments()}

        {/* Render URLs below content */}
        {urls.length > 0 && (
          <div className="mt-4 mx-4">
            {urls.map((url, index) => (
              <div key={index} className="mb-2">
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brandPrimary hover:text-brandPrimary/80 hover:underline"
                >
                  {url}
                </a>
                {/* Show preview for the first link only */}
                {index === 0 && <LinkPreview url={url} />}
              </div>
            ))}
          </div>
        )}
      </>
    );
  };

  const ImageComponent = ({ attachment, onClick, isFirstImage }) => {
    const [isLoading, setIsLoading] = useState(true);

    return (
      <div
        className="relative overflow-hidden cursor-pointer group"
        onClick={onClick}
      >
        {/* Blurred background and shimmer effect */}
        <div
          className="absolute inset-0 blur-xl scale-110"
          style={{
            backgroundImage: `url(${attachment.url})`,
            backgroundPosition: "center",
            backgroundSize: "cover",
            opacity: "0.5",
          }}
        />

        {/* Shimmer loading effect */}
        {isLoading && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
        )}

        {/* Image container */}
        <div className="relative w-full h-60 flex items-center justify-center bg-gray-100/30">
          <img
            src={attachment.url}
            alt=""
            loading="lazy"
            className={`w-full h-full object-contain ${
              isFirstImage ? "max-h-[350px]" : "max-h-60"
            } transition-all duration-300 group-hover:scale-105`}
            onLoad={() => setIsLoading(false)}
          />

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
            <ZoomIn
              className="text-white opacity-0 group-hover:opacity-100 transition-all"
              size={24}
            />
          </div>
        </div>
      </div>
    );
  };

  const renderAttachments = () => {
    if (!post_data?.attachments?.length) return null;

    const gridClassName = {
      1: "grid-cols-1",
      2: "grid-cols-2",
      3: "grid-cols-2",
      4: "grid-cols-2",
    }[Math.min(post_data?.attachments.length, 4)];

    return (
      <div className={`grid ${gridClassName} gap-1 max-h-[500px] mb-4`}>
        {post_data?.attachments.slice(0, 4).map((attachment, index) => (
          <div
            key={attachment.id}
            className={`${
              post_data?.attachments.length === 3 && index === 2
                ? "col-span-2"
                : ""
            } relative`} // Added relative here
          >
            {attachment.type === "video" ? (
              <div className="relative overflow-hidden">
                <video
                  src={attachment.url}
                  className={`w-full h-60 object-contain ${
                    post_data?.attachments?.length <= 1 &&
                    "max-h-full h-[350px]"
                  } hover:scale-105 transition-transform duration-300`}
                  controls
                />
                {/* <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                  <svg
                    className="w-12 h-12 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div> */}
              </div>
            ) : (
              <ImageComponent
                attachment={attachment}
                onClick={() => setViewPostAttachmentModal(true)}
                isFirstImage={post_data?.attachments?.length <= 1}
              />
            )}

            {/* Overlay for the last image when there are more than 4 attachments */}
            {index === 3 && post_data?.attachments?.length > 4 && (
              <div
                className="absolute inset-0 bg-black/50 flex items-center justify-center cursor-pointer"
                onClick={() => setViewPostAttachmentModal(true)}
              >
                <span className="text-white text-2xl font-bold hover:scale-125">
                  +{post_data?.attachments?.length - 4}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <AsyncComponent>
      <CardContent className="p-0">{renderText(post_data?.body)}</CardContent>
      {viewPostAttachmentModal && (
        <PhotoVideoCarousel
          isOpen={viewPostAttachmentModal}
          onClose={() => setViewPostAttachmentModal(false)}
          attachments={post_data?.attachments}
        />
      )}
    </AsyncComponent>
  );
}
