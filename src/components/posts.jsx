import {
  capitalizeName,
  formatCounts,
  formatTimeAgo,
  getInitials,
} from "@/utils/stringFormat";
import PhotoVideoPost from "./photo-video-post";
import PollPost from "./poll-post";
import AsyncComponent from "./async-component";
import { Card, CardContent, CardFooter, CardHeader } from "./ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import {
  ICON_COMMENT,
  ICON_EMOJI,
  ICON_LIKE,
  ICON_LIKEFILLED,
  ICON_SAVE,
  ICON_SEND,
  ICON_SHARE,
} from "@/constants/iconUrls";
import EmojiPicker from "emoji-picker-react";
import { NavLink } from "react-router";
import { Input } from "./ui/input";
import { useWindowSize } from "@/hooks/useWindowSize";
import PostEditDeleteDropDown from "./post-edit-dropdown";
import { route_view_poll, route_view_post } from "@/constants/routeEnpoints";
import { useCreateComment, usePostReactions } from "@/hooks/usePosts";
import { useState } from "react";
import { PRIVACYDROPDOWN } from "@/constants/dropDownConstants";
import { useClickOutside } from "@/hooks/useClickOutside";
import LikesDialog from "./likes-dialog";
import { BadgeCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { encryptId } from "@/utils/encryption";
import { createPortal } from "react-dom";

export default function Posts({ post, user }) {
  const { width } = useWindowSize();
  const { t } = useTranslation();
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const onEmojiClick = (emojiData) => {
    setCommentInput((prev) => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };
  const emojiPickerRef = useClickOutside(() => {
    const emojiPickerElement = document.querySelector(".EmojiPickerReact");
    if (emojiPickerElement?.contains(event.target)) {
      return; // Don't close if clicking inside emoji picker
    }
    setShowEmojiPicker(false);
  });
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
  } = post;

  const [isLikesDialogOpen, setLikesDialogOpen] = useState(false);
  const likeData = reactions?.like || { count: 0, users: [] };

  const handleLikesClick = () => {
    setLikesDialogOpen(true);
  };
  const [commentInput, setCommentInput] = useState("");
  const createCommentMutation = useCreateComment();
  const postReactionMutation = usePostReactions();
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
  const handleCommentInputChange = (e) => {
    setCommentInput(e.target.value);
  };
  const hasUserReacted = (type) => {
    return user_reaction?.type === type;
  };
  const getReactionCount = (type) => {
    return reactions?.[type]?.count || 0;
  };
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

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleCreateComment();
    }
  };

  const renderPost = (post) => {
    switch (post?.type) {
      case "poll":
        return <PollPost post={post} key={id} />;
      case "normal":
        return <PhotoVideoPost post={post} key={id} />;
    }
  };

  const [emojiPosition, setEmojiPosition] = useState({ top: 0, left: 0 });

  const handleEmojiClick = (event) => {
    event.stopPropagation();
    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();
    setEmojiPosition({
      top: rect.top - 400, // Height of emoji picker
      left: rect.right - 300, // Width of emoji picker
    });
    setShowEmojiPicker(!showEmojiPicker);
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
                <div className="flex items-center flex-wrap gap-1 max-w-full">
                  <h3 className="font-semibold dark:text-white line-clamp-1 overflow-hidden flex items-center gap-1 min-w-0 flex-shrink">
                    <span className="truncate">
                      {capitalizeName(author_details?.first_name) +
                        " " +
                        capitalizeName(author_details?.last_name)}
                    </span>
                    {author_details?.is_brand_page && (
                      <span className="text-brandPrimary flex-shrink-0">
                        <BadgeCheck className="w-4 h-4" />
                      </span>
                    )}
                  </h3>
                  {post_data?.feeling && (
                    <div className="flex gap-1 items-center flex-shrink-0">
                      <span className="text-sm">•</span>
                      <span className="text-sm">Feeling</span>
                      <span className="text-sm font-medium flex items-center gap-1 text-primary">
                        {t(post_data?.feeling.name)}
                        <img
                          src={post_data?.feeling.image_url}
                          className="w-5 h-5"
                          alt={post_data?.feeling.name}
                        />
                      </span>
                    </div>
                  )}
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
                <PostEditDeleteDropDown type={type} id={id} />
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 pb-2">
          {renderPost(post)}
          <div className="flex justify-between mt-5 px-4">
            <div className="flex items-center gap-6">
              <button className="flex items-center gap-2 h-18 w-18">
                <img
                  src={hasUserReacted("like") ? ICON_LIKEFILLED : ICON_LIKE}
                  className={`w-5 h-5 transform transition-transform duration-300 ease-in-out hover:scale-125 cursor-pointer fill-current
                                    ${
                                      postReactionMutation.isPending
                                        ? "opacity-50"
                                        : ""
                                    }`}
                  alt="Like"
                  onClick={() => handlePostReaction(id, "like")}
                  disabled={postReactionMutation.isPending}
                />
                <span
                  className="text-sm cursor-pointer"
                  onClick={handleLikesClick}
                >
                  {reactions?.["like"]?.count || 0} &nbsp;
                  {reactions?.["like"]?.count > 1
                    ? t("likes")?.toLocaleLowerCase()
                    : t("like")?.toLocaleLowerCase()}
                </span>
              </button>
              <NavLink
                to={`${
                  type === "normal" ? route_view_post : route_view_poll
                }/${encryptId(id)}`}
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
              </NavLink>
              {/* <button className="flex items-center gap-2  h-18 w-18">
                <img
                  src={ICON_SHARE}
                  className="w-5 h-5 transform transition-transform duration-300 ease-in-out hover:scale-125 cursor-pointer"
                />
              </button> */}
            </div>
          </div>
        </CardContent>
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
              to={`${
                type === "normal" ? route_view_post : route_view_poll
              }/${encryptId(id)}`}
              className="w-full"
            >
              <Input
                type="text"
                placeholder={t("add_comment")}
                className="boder rounded-full shadow-none h-10 px-4"
                style={{ width: "100%" }}
                value={commentInput}
                onChange={handleCommentInputChange}
                onKeyPress={handleKeyPress}
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
                    onClick={(e) => e.stopPropagation()}
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
