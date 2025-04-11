import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useKincoinRewardEvents } from "@/hooks/useMasters";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import ComponentLoading from "@/components/component-loading";

export default function EarnKincoins() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: rewardEvents, isLoading } = useKincoinRewardEvents();

  if (isLoading) {
    return <ComponentLoading />;
  }

  const getIconPath = (eventType) => {
    const iconMap = {
      add_member: "/kincoinsImg/add-member.png",
      add_post: "/kincoinsImg/post.png",
      will_creation: "/kincoinsImg/will.png",
      profile_completion: "/kincoinsImg/complete-profile.png",
    };
    return iconMap[eventType] || "/kincoinsImg/kintree_coin.svg";
  };

  const getNavigationPath = (eventType) => {
    const pathMap = {
      add_member: "/familytree",
      add_post: "/foreroom/createpost",
      will_creation: "/will",
      profile_completion: "/profile",
    };
    return pathMap[eventType] || "/";
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 p-2 md:p-4">
      {rewardEvents?.map((event) => (
        <Card
          key={event.id}
          className="rounded-2xl hover:shadow-md transition-shadow"
        >
          <CardContent className="p-3 md:p-4 flex flex-col lg:flex-row items-start md:items-center justify-between gap-3 md:gap-4">
            <div className="flex items-start md:items-center gap-3 md:gap-4 w-full md:w-auto">
              <div className="p-3 md:p-4 bg-background rounded-xl shrink-0">
                <img
                  src={getIconPath(event.name)}
                  className="h-8 w-8 md:h-10 md:w-10"
                  alt={t(`${event.type}_icon`)}
                />
              </div>
              <div className="flex flex-col flex-1 md:flex-none">
                <h2 className="text-base md:text-lg font-medium text-foreground">
                  {event.title || t(event.name)}
                </h2>
                <p className="text-xs md:text-sm font-medium text-muted-foreground line-clamp-2 md:line-clamp-1">
                  {t("earn")} {parseInt(event.coins)} {t("kincoins")}
                </p>
              </div>
            </div>

            <Button
              className="rounded-full px-6 md:px-8 w-full md:w-auto"
              onClick={() => navigate(getNavigationPath(event.name))}
            >
              {t("earn_now")}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
