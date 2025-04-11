import AsyncComponent from "@/components/async-component";
import { ICON_CHECK_BRAND } from "@/constants/iconUrls";
import { usePollVote } from "@/hooks/usePosts";
import { formatTimeAgo } from "@/utils/stringFormat";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import PollVotersDialog from "./poll-voters-dialog";

export default function PollPost({ post, user, onReactionUpdate }) {
  const { t } = useTranslation();
  const [openPollVioters, setOpenPollVioters] = useState(false);
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

  const isPollEnded = () => {
    const endDate = new Date(post_data.poll_end_date);
    endDate.setHours(23, 59, 59, 999);
    const now = new Date();
    return now > endDate;
  };

  const isPollActive = () => {
    const now = new Date();
    const startDate = new Date(post_data.poll_start_date);
    const endDate = new Date(post_data.poll_end_date);
    endDate.setHours(23, 59, 59, 999);
    return startDate <= now && now <= endDate;
  };

  const getDaysRemaining = (endDate) => {
    const now = new Date();
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    const diff = end.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const pollVoteMutation = usePollVote();
  const handleVote = (optionId) => {
    if (!post_data?.is_user_voted && isPollActive()) {
      pollVoteMutation.mutate(
        {
          pollId: post_data.id,
          optionId,
        },
        {
          onSuccess: () => {
            if (onReactionUpdate) {
              onReactionUpdate();
            }
          },
          onError: (error) => {
            console.error("Error voting:", error);
          },
        },
      );
    }
  };

  const isInteractionDisabled =
    post_data?.is_user_voted || isPollEnded() || !isPollActive();

  return (
    <AsyncComponent>
      <h2 className="text-lg font-normal mb-4 pt-4 px-4">
        {post_data?.question}
      </h2>
      <div className="space-y-3 p-5 border rounded-2xl mx-4">
        {post_data?.options?.map((option) => {
          const isVoted = post_data?.user_voted_option_ids?.includes(option.id);
          const votePercentage =
            post_data?.poll_total_votes > 0
              ? Math.round(
                  (option.vote_count / post_data.poll_total_votes) * 100,
                )
              : 0;
          const isHighestVoted =
            Math.max(...post_data?.options?.map((o) => o?.vote_count)) ===
            option?.vote_count;

          return (
            <div
              key={option.id}
              className={`relative ${
                !isInteractionDisabled
                  ? "hover:bg-gray-50 dark:hover:bg-gray-800 rounded-full"
                  : ""
              }`}
              onClick={() => !isInteractionDisabled && handleVote(option.id)}
              role={!isInteractionDisabled ? "button" : "presentation"}
              aria-disabled={isInteractionDisabled}
            >
              {/* Background bar showing vote percentage */}
              {(post_data.is_user_voted || isPollEnded()) && (
                <div
                  className={`absolute rounded-full left-0 top-0 h-full transition-all duration-500 ${
                    isHighestVoted && option.vote_count > 0
                      ? "bg-primary/20"
                      : "bg-gray-400/20"
                  }`}
                  style={{ width: `${votePercentage}%` }}
                />
              )}

              {/* Content */}
              <div
                className={`relative p-3 rounded-full border transition-colors
                  ${isVoted ? "border-brandPrimary" : "border-gray-200"}
                  ${isHighestVoted ? "border-brandPrimary" : ""}
                  ${pollVoteMutation.isPending ? "opacity-50" : ""}
                  ${
                    !isInteractionDisabled ? "cursor-pointer" : "cursor-pointer"
                  }
                `}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium flex gap-1 items-center">
                    {option.option}
                    {isVoted && (
                      <span className="ml-2">
                        <img src={ICON_CHECK_BRAND} className="h-5 w-5" />
                      </span>
                    )}
                  </span>
                  {(post_data.is_user_voted || isPollEnded()) && (
                    <span className="text-sm text-gray-600">
                      {option.vote_count}{" "}
                      {option.vote_count > 1 ? t("votes") : t("vote")} (
                      {votePercentage}%)
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div className="mt-4 text-sm text-gray-600 flex justify-between">
          {isPollEnded() ? (
            <div className="flex gap-2">
              <span>
                {post_data?.poll_total_votes} {} {t("total_votes")}
              </span>
              <span>•</span>
              <span>
                {t("poll_ended")} {formatTimeAgo(post_data.poll_end_date)}
              </span>
            </div>
          ) : (
            <span>
              {getDaysRemaining(post_data.poll_end_date)} {t("days_remaining")}
            </span>
          )}
          {post_data.polls_creator && (
            <span
              className="text-primary cursor-pointer"
              onClick={() => setOpenPollVioters(true)}
            >
              {t("view_results")}
            </span>
          )}
        </div>
      </div>
      {openPollVioters ? (
        <PollVotersDialog
          isOpen={openPollVioters}
          onClose={() => setOpenPollVioters(false)}
          pollId={post_data.id}
        />
      ) : null}
    </AsyncComponent>
  );
}
