import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Card, CardContent, CardFooter, CardHeader } from "./ui/card";
import { format } from "date-fns";
import { BadgeCheck, ImageOff } from "lucide-react";
import { useTranslation } from "react-i18next";
import { NavLink } from "react-router";
import { useState } from "react";
import AsyncComponent from "./async-component";
import { Input } from "./ui/input";
import { capitalizeName, getInitials } from "@/utils/stringFormat";
import {
  ICON_COMMENT,
  ICON_EMOJI,
  ICON_LIKE,
  ICON_LIKEFILLED,
  ICON_SEND,
} from "@/constants/iconUrls";
import { PRIVACYDROPDOWN } from "@/constants/dropDownConstants";
import LikesDialog from "./likes-dialog";
import { useClickOutside } from "@/hooks/useClickOutside";
import EmojiPicker from "emoji-picker-react";
import { createPortal } from "react-dom";
import { useCreateComment, usePostReactions } from "@/hooks/usePosts";
import { encryptId } from "@/utils/encryption";
import RecipeEditDeleteDropDown from "./recipe-edit-delete-dropdown";

const ImageWithFallback = ({ src, alt, className, onClick }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  return (
    <div className={`relative ${className}`}>
      {/* Loading state */}
      {isLoading && <div className="absolute inset-0 animate-pulse bg-muted" />}

      {/* Error state */}
      {hasError ? (
        <div className="w-full h-full flex items-center justify-center bg-muted">
          <ImageOff className="w-8 h-8 text-muted-foreground" />
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            isLoading ? "opacity-0" : "opacity-100"
          }`}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setHasError(true);
          }}
          onClick={onClick}
        />
      )}
    </div>
  );
};

export default function RecipeCard({
  recipe,
  user,
  isRecipeCommentPage,
  showCommentInput = true,
}) {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [commentInput, setCommentInput] = useState("");
  const [isLikesDialogOpen, setLikesDialogOpen] = useState(false);
  const [emojiPosition, setEmojiPosition] = useState({ top: 0, left: 0 });
  const postReactionMutation = usePostReactions();
  const createCommentMutation = useCreateComment();

  const handlePostReaction = (type = "like") => {
    postReactionMutation.mutate(
      {
        postId: id,
        type: "like",
      },
      {
        onError: (error) => {
          console.error("Error handling reaction:", error);
        },
      }
    );
  };

  const handleCreateComment = () => {
    if (commentInput.trim() === "" || commentInput.length < 1) return;
    createCommentMutation.mutate(
      { postId: id, comment: commentInput },
      {
        onSuccess: () => {
          setCommentInput("");
        },
      }
    );
  };

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
    type,
  } = recipe;

  const likeData = reactions?.like || { count: 0, users: [] };
  const emojiPickerRef = useClickOutside(() => setShowEmojiPicker(false));

  const renderText = (text) => {
    if (!text) return null;

    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls = text.match(urlRegex) || [];
    const textContent = text.replace(urlRegex, "").trim();

    const renderTextContent = (content) => {
      if (content.length < 150) {
        return <div className="mb-4 px-4">{content}</div>;
      }

      let truncatedText = content.substring(0, 150);
      truncatedText = truncatedText.substring(
        0,
        truncatedText.lastIndexOf(" ")
      );

      return (
        <div className="mb-4 px-4">
          <div className="text-md font-normal transition-all duration-300 ease-in-out">
            {isExpanded ? content : truncatedText + "..."}
          </div>
          <NavLink to={`/view-recipe/${encryptId(post_data?.id)}`}>
            <button className="text-brandPrimary hover:text-brandPrimary/80 text-sm font-medium mt-2 transition-colors duration-200">
              {t("view_recipe")}
            </button>
          </NavLink>
        </div>
      );
    };

    return (
      <>
        {renderTextContent(textContent)}
        {urls.length > 0 && (
          <div className="mt-4 px-4">
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
              </div>
            ))}
          </div>
        )}
      </>
    );
  };

  const handleEmojiClick = (event) => {
    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();
    setEmojiPosition({
      top: rect.top - 400,
      left: rect.right - 300,
    });
    setShowEmojiPicker(!showEmojiPicker);
  };

  const onEmojiClick = (emojiData) => {
    setCommentInput((prev) => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  return (
    <AsyncComponent>
      <Card className="w-full mx-auto shadow-sm rounded-2xl overflow-hidden">
        <CardHeader className="border-b p-5">
          <div className="grid grid-cols-8 gap-5 w-full">
            <div className="flex items-center gap-3 col-span-7 w-full">
              <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center cursor-pointer transform transition-transform duration-300 ease-in-out hover:scale-105 border">
                <Avatar className="items-center justify-center">
                  <AvatarImage src={author_details?.profile_pic_url} />
                  <AvatarFallback>
                    {getInitials(author_details?.first_name) +
                      " " +
                      getInitials(author_details?.last_name)}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div>
                <div className="flex items-center gap-1">
                  <h3 className="font-semibold dark:text-white line-clamp-1 overflow-hidden flex items-center gap-1">
                    {capitalizeName(author_details?.first_name) +
                      " " +
                      capitalizeName(author_details?.last_name)}{" "}
                    {author_details?.is_brand_page && (
                      <span className="text-brandPrimary">
                        <BadgeCheck className="w-4 h-4" />
                      </span>
                    )}
                  </h3>
                </div>
                <div className="flex flex-wrap items-center space-x-2 text-sm">
                  {created_at === updated_at ? (
                    <span>
                      {format(created_at, "dd MMM yyyy 'at' h:mmaaa")}
                    </span>
                  ) : (
                    <span>
                      {t("edited")}{" "}
                      {format(updated_at, "dd MMM yyyy 'at' h:mmaaa")}
                    </span>
                  )}
                  <img
                    src={
                      PRIVACYDROPDOWN?.find((item) => item.id === privacy)?.icon
                    }
                    className="h-4 w-4"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-3 col-span-1 justify-end items-start">
              {user?.id === author_details?.id && (
                <RecipeEditDeleteDropDown
                  type={type}
                  id={id}
                  recipeId={post_data?.id}
                />
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <h3 className="text-lg font-semibold mb-2 px-4">{post_data.title}</h3>
          {renderText(post_data.description)}
          <NavLink to={`/view-recipe/${encryptId(post_data?.id)}`}>
            <div className="aspect-video overflow-hidden mb-4">
              {/* <img
                src={post_data.attachment?.url}
                alt={post_data.title}
                className="w-full h-full object-cover"
              /> */}
              <ImageWithFallback
                src={post_data.attachment?.url}
                alt={post_data.title}
                className="w-full h-full"
              />
            </div>
          </NavLink>

          <div className="flex justify-between mt-5 px-4 mb-4">
            <div className="flex items-center gap-6">
              <button className="flex items-center gap-2 h-18 w-18">
                <img
                  src={
                    user_reaction?.type === "like" ? ICON_LIKEFILLED : ICON_LIKE
                  }
                  className="w-5 h-5 transform transition-transform duration-300 ease-in-out hover:scale-125 cursor-pointer"
                  alt="Like"
                  onClick={() => handlePostReaction("like")}
                />
                <span
                  className="text-sm cursor-pointer"
                  onClick={() => setLikesDialogOpen(true)}
                >
                  {reactions?.["like"]?.count || 0} &nbsp;
                  {reactions?.["like"]?.count > 1
                    ? t("likes")?.toLocaleLowerCase()
                    : t("like")?.toLocaleLowerCase()}
                </span>
              </button>
              {/* <NavLink
                to={`/view-recipe/${encryptId(post_data?.id)}`}
                className="flex items-center gap-2 h-18 w-18"
              >
                <img
                  src={ICON_COMMENT}
                  className="w-5 h-5 transform transition-transform duration-300 ease-in-out hover:scale-125 cursor-pointer"
                />
                <span className="text-sm">
                  {comment_counts || 0} &nbsp;
                  {comment_counts > 1
                    ? t("comments").toLowerCase()
                    : t("comment").toLowerCase()}
                </span>
              </NavLink> */}
              {showCommentInput ? (
                <NavLink to={`/recipe/${encryptId(post_data?.id)}`}>
                  <div className="flex items-center gap-2 h-18 w-18">
                    <img
                      src={ICON_COMMENT}
                      className="w-5 h-5 transform transition-transform duration-300 ease-in-out hover:scale-125 cursor-pointer"
                    />
                    <span className="text-sm">
                      {comment_counts || 0} {t("comments")}
                    </span>
                  </div>
                </NavLink>
              ) : (
                <div className="flex items-center gap-2 h-18 w-18">
                  <img src={ICON_COMMENT} className="w-5 h-5" />
                  <span className="text-sm">
                    {comment_counts || 0} {t("comments")}
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardContent>

        {showCommentInput ? (
          <CardFooter className="p-4 flex gap-5 w-full border-t">
            <div className="flex items-center gap-3 col-span-8 lg:col-span-5 xl:col-span-6 w-full">
              <div tabIndex={0} role="button" className="w-10 rounded-full">
                <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center cursor-pointer transform transition-transform duration-300 ease-in-out hover:scale-105 border">
                  <Avatar className="items-center justify-center">
                    <AvatarImage src={user?.profile_pic_url} />
                    <AvatarFallback>{user?.userInitials}</AvatarFallback>
                  </Avatar>
                </div>
              </div>
              <NavLink
                to={`recipe/${encryptId(post_data?.id)}`}
                className="w-full"
              >
                <Input
                  type="text"
                  placeholder={t("add_comment")}
                  className="border rounded-full shadow-none h-10 px-4"
                  style={{ width: "100%" }}
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                />
              </NavLink>
            </div>
            <div className="flex items-center gap-3 col-span-8 justify-end">
              <img
                src={ICON_SEND}
                onClick={() => handleCreateComment()}
                className="transform transition-transform duration-300 ease-in-out hover:scale-125 cursor-pointer max-w-7"
              />
              <div className="relative" ref={emojiPickerRef}>
                <img
                  src={ICON_EMOJI}
                  onClick={handleEmojiClick}
                  className="transform transition-transform duration-300 ease-in-out hover:scale-125 cursor-pointer max-w-7"
                />
                {showEmojiPicker &&
                  createPortal(
                    <div
                      style={{
                        position: "fixed",
                        top: `${emojiPosition.top}px`,
                        left: `${emojiPosition.left}px`,
                        zIndex: 50,
                      }}
                    >
                      <div className="shadow-lg rounded-lg">
                        <EmojiPicker
                          onEmojiClick={onEmojiClick}
                          width={300}
                          height={400}
                        />
                      </div>
                    </div>,
                    document.body
                  )}
              </div>
            </div>
          </CardFooter>
        ) : null}
      </Card>

      {isLikesDialogOpen && (
        <LikesDialog
          isOpen={isLikesDialogOpen}
          onClose={() => setLikesDialogOpen(false)}
          likes={likeData.users}
          postId={id}
        />
      )}
    </AsyncComponent>
  );
}
