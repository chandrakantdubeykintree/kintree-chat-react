import {
  capitalizeName,
  formatCounts,
  formatTimeAgo,
  getInitials,
} from "@/utils/stringFormat";
import PhotoVideoPost from "./photo-video-post";
import PollPost from "./poll-post";
import AsyncComponent from "./async-component";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import {
  ICON_COMMENT,
  ICON_LIKE,
  ICON_LIKEFILLED,
  ICON_SHARE,
} from "@/constants/iconUrls";
import { NavLink, useLocation } from "react-router";
import { useWindowSize } from "@/hooks/useWindowSize";
import PostEditDeleteDropDown from "./post-edit-dropdown";
import { route_view_poll, route_view_post } from "@/constants/routeEnpoints";
import { usePostReactions } from "@/hooks/usePosts";
import { PRIVACYDROPDOWN } from "@/constants/dropDownConstants";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { BadgeCheck } from "lucide-react";
export default function Post({ post, user, onReactionUpdate }) {
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
    type,
  } = post;
  const { width } = useWindowSize();
  const location = useLocation();
  const isViewPost = location.pathname.substring("/viewpost");

  const postReactionMutation = usePostReactions();

  const hasUserReacted = (type) => {
    return user_reaction?.type === type;
  };

  const getReactionCount = (type) => {
    return reactions?.[type]?.count || 0;
  };

  const handlePostReaction = (id, type = "like") => {
    postReactionMutation.mutate({
      postId: id,
      type: type,
    });
    if (onReactionUpdate) {
      onReactionUpdate();
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
  return (
    <AsyncComponent>
      <Card className="w-full mx-auto shadow-sm border-0 rounded-2xl overflow-hidden">
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
                <PostEditDeleteDropDown type={type} id={id} isviewpost={true} />
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {renderPost(post)}
          <div className="flex justify-between mt-5 mx-4 mb-4">
            <div className="flex items-center gap-6">
              <button
                onClick={() => handlePostReaction(id, "like")}
                className="flex items-center gap-2 h-18 w-18"
                disabled={postReactionMutation.isPending}
              >
                <img
                  src={hasUserReacted("like") ? ICON_LIKEFILLED : ICON_LIKE}
                  className={`w-5 h-5 transform transition-transform duration-300 ease-in-out hover:scale-125 cursor-pointer fill-current
                ${postReactionMutation.isPending ? "opacity-50" : ""}`}
                  alt="Like"
                />
                <span className="text-sm">
                  {reactions?.["like"]?.count || 0} &nbsp;
                  {reactions?.["like"]?.count > 1
                    ? t("likes")?.toLocaleLowerCase()
                    : t("like")?.toLocaleLowerCase()}
                </span>
              </button>

              {isViewPost ? (
                <div className="flex items-center gap-2 h-18 w-18">
                  <img
                    src={ICON_COMMENT}
                    className="w-5 h-5 transform transition-transform duration-300 ease-in-out hover:scale-125 cursor-pointer"
                  />
                  <span className="text-sm">
                    {/* {formatCounts("comment", comment_counts || 0, width)} */}
                    {comment_counts || 0} &nbsp;
                    {comment_counts > 1
                      ? t("comments").toLowerCase()
                      : t("comment").toLowerCase()}
                  </span>
                </div>
              ) : (
                <NavLink
                  to={`${
                    type === "normal" ? route_view_post : route_view_poll
                  }/${id}`}
                  className="flex items-center gap-2 h-18 w-18"
                >
                  <img
                    src={ICON_COMMENT}
                    className="w-5 h-5 transform transition-transform duration-300 ease-in-out hover:scale-125 cursor-pointer"
                  />
                  <span>
                    {formatCounts("comment", comment_counts || 0, width)}
                  </span>
                </NavLink>
              )}
              {/* <button className="flex items-center gap-2  h-18 w-18">
                <img
                  src={ICON_SHARE}
                  className="w-5 h-5 transform transition-transform duration-300 ease-in-out hover:scale-125 cursor-pointer"
                />
              </button> */}
            </div>
          </div>
        </CardContent>
      </Card>
    </AsyncComponent>
  );
}
