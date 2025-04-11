import AsyncComponent from "./async-component";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { usePoll } from "@/hooks/usePosts";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { getInitials } from "@/utils/stringFormat";
import ComponentLoading from "./component-loading";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import EmptyState from "./empty-state";

export default function PollVotersDialog({ isOpen, onClose, pollId }) {
  const { t } = useTranslation();
  const { data: pollsData, isLoading } = usePoll(pollId);
  const [activeTab, setActiveTab] = useState(0);

  if (isLoading) {
    return <ComponentLoading />;
  }

  const renderVotersList = (voters) => {
    if (!voters || voters.length === 0) {
      return (
        <EmptyState
          message={t("no_votes_right_now")}
          message2={t("come_back_later")}
          title={t("no_votes")}
          imgSrc={"/illustrations/no-votes.svg"}
        />
      );
    }

    return (
      <div className="space-y-4 mt-4 overflow-y-scroll no_scrollbar">
        {voters.map((voter) => (
          <div key={voter.id} className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={voter.profile_pic_url} />
              <AvatarFallback>
                {getInitials(voter.first_name + " " + voter.last_name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm font-medium">
                {voter.first_name} {voter.last_name}
              </span>
              <span className="text-xs text-gray-500">@{voter.username}</span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <AsyncComponent>
      <Dialog open={isOpen} onOpenChange={onClose} modal={true}>
        <DialogContent className="sm:w-[650px] max-w-[90%] h-max-96 overflow-y-auto no_scrollbar rounded-2xl sm:rounded-2xl">
          <DialogHeader>
            <DialogTitle>{t("poll_voters")}</DialogTitle>
          </DialogHeader>
          <div className="flex border-b overflow-x-auto no_scrollbar">
            {pollsData?.data?.options?.map((option, index) => (
              <button
                key={option.id}
                className={`flex-1 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === index
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
                onClick={() => setActiveTab(index)}
              >
                <span className="overflow-ellipsis">Option {index + 1}</span>
                <span className="ml-1 text-xs text-gray-500">
                  ({option.vote_count})
                </span>
              </button>
            ))}
          </div>
          <div className="max-h-[500px]">
            <div className="text-lg">
              {pollsData.data.options[activeTab].option}
            </div>
            {pollsData?.data?.options &&
              renderVotersList(pollsData.data.options[activeTab].voted_users)}
          </div>
        </DialogContent>
      </Dialog>
    </AsyncComponent>
  );
}
