import AsyncComponent from "./async-component";
import { useFetchPostReactions } from "@/hooks/usePosts";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { getInitials } from "@/utils/stringFormat";
import ComponentLoading from "./component-loading";
import { useParams } from "react-router";
import { Card } from "./ui/card";
import { useTranslation } from "react-i18next";

export default function LikesCard({ isOpen, onClose }) {
  const { t } = useTranslation();

  const { postId } = useParams();
  const { data: likesData, isLoading } = useFetchPostReactions(postId);

  if (isLoading) {
    return <ComponentLoading />;
  }

  return (
    <AsyncComponent>
      <Card>
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
          <p>{t("no_likes_yet")}</p>
        )}
      </Card>
    </AsyncComponent>
  );
}
