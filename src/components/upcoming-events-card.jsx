import { useEvents } from "@/hooks/useEvents";
import ComponentLoading from "./component-loading";
import EventCard from "./event-card";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { useTranslation } from "react-i18next";

export default function UpcomingEventsCard() {
  const { t } = useTranslation();
  const { data, isLoading } = useEvents("upcoming");
  const eventsList = data?.pages?.flatMap((page) => page?.data?.events);
  if (isLoading) return <ComponentLoading />;
  if (eventsList?.length === 0) return null;
  return (
    <Card className="w-full max-w-sm mx-auto shadow-sm rounded-2xl overflow-hidden">
      <CardHeader>
        <CardTitle>{t("upcoming_events")}</CardTitle>
      </CardHeader>
      <CardContent className="bg-none border-none shadow-none">
        <ul className="overflow-y-scroll min-h-20 max-h-96 no_scrollbar gap-2 flex flex-col">
          {eventsList.length === 0 && (
            <div className="flex justify-center items-center h-full">
              <span className="text-sm font-light">
                {t("no_upcoming_events")}
              </span>
            </div>
          )}
          {eventsList.map((event) => (
            <EventCard event={event} key={event?.id} />
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
