import AsyncComponent from "./async-component";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { useFetchPostReactions } from "@/hooks/usePosts";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { getInitials } from "@/utils/stringFormat";
import ComponentLoading from "./component-loading";
import { useTranslation } from "react-i18next";
import EmptyState from "./empty-state";

export default function LikesDialog({ isOpen, onClose, postId }) {
  const { t } = useTranslation();
  const { data: likesData, isLoading } = useFetchPostReactions(postId);

  if (isLoading) {
    <ComponentLoading />;
  }

  return (
    <AsyncComponent>
      <Dialog open={isOpen} onOpenChange={onClose} modal={true}>
        <DialogContent className="w-96 h-max-96 overflow-y-auto no_scrollbar rounded-2xl sm:rounded-2xl">
          <DialogHeader>
            <DialogTitle>{t("people_who_liked_this_post")}</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            {likesData?.data?.reactions?.length || 0}&nbsp;
            {t("people_liked_this_post")}
          </DialogDescription>
          <hr />
          {likesData?.data?.reactions?.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {likesData?.data?.reactions?.map((user) => (
                <li
                  key={user.author_details.id}
                  className="flex items-center gap-2"
                >
                  <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center cursor-pointer transform transition-transform duration-300 ease-in-out hover:scale-105 border">
                    <Avatar className="items-center justify-center">
                      <AvatarImage src={user.author_details.profile_pic_url} />
                      <AvatarFallback>
                        {getInitials(user.author_details.first_name) +
                          " " +
                          getInitials(user.author_details.last_name)}
                      </AvatarFallback>
                    </Avatar>
                  </div>

                  <div className="flex flex-col">
                    <span className="text-sm font-medium">
                      {user.author_details.first_name}{" "}
                      {user.author_details.last_name}
                    </span>
                    <span className="text-sm text-gray-500">
                      {user?.relation}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              message={t("no_likes_right_now")}
              message2={t("come_back_later")}
              title={t("no_likes")}
              imgSrc={"/illustrations/no-likes.svg"}
            />
          )}
        </DialogContent>
      </Dialog>
    </AsyncComponent>
  );
}
