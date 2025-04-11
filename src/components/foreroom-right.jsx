import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { capitalizeName, formatTimeAgoBirthDay } from "@/utils/stringFormat";
import UpcomingEventsCard from "./upcoming-events-card";
import ContactsListCard from "./contacts-list-card";
import AsyncComponent from "./async-component";
import { useTranslation } from "react-i18next";

export default function ForeroomRight({
  birthDaysToday = [],
  birthDaysUpcoming = [],
  birthDaysPast = [],
  recentChatsList = [],
  contactsList = [],
}) {
  const { t } = useTranslation();
  return (
    <AsyncComponent>
      <div className="grid gap-6">
        <Card className="w-full max-w-sm mx-auto shadow-sm rounded-2xl overflow-hidden">
          <CardHeader>
            <CardTitle>{t("birthdays")}</CardTitle>
          </CardHeader>
          <CardContent>
            <h2 className="text-sm font-semibold">{t("today")}</h2>
            <br />
            <ul className="min-h-20">
              {birthDaysToday.length === 0 && (
                <div className="flex justify-center items-center h-full">
                  <span className="text-sm font-light">
                    {t("no_birthdays_today")}
                  </span>
                </div>
              )}
              {birthDaysToday.map((birthday) => (
                <li key={birthday?.id} className="flex gap-2 mb-6">
                  <div className="overflow-hidden w-[45px] rounded-full">
                    <img
                      src={birthday?.profile_picture}
                      className="w-[45px] rounded-full transform transition-transform duration-300 ease-in-out hover:scale-125"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className="text-sm font-semibold">
                      {capitalizeName(birthday?.first_name)}{" "}
                      {capitalizeName(birthday?.last_name)}
                    </span>
                    <span className="text-sm font-light">
                      {formatTimeAgoBirthDay(birthday?.date_of_birth)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
            <h2 className="text-sm font-semibold">{t("recent")}</h2>
            <br />
            <ul className="min-h-20">
              {birthDaysPast.length === 0 && (
                <div className="flex justify-center items-center h-full">
                  <span className="text-sm font-light">
                    {t("no_recent_birthdays")}
                  </span>
                </div>
              )}
              {birthDaysPast.map((birthday) => (
                <li
                  key={birthday?.id}
                  className="overflow-hidden flex gap-2 mb-6"
                >
                  <div className="overflow-hidden w-[45px] rounded-full">
                    <img
                      src={birthday?.profile_picture}
                      className="w-[45px] rounded-full transform transition-transform duration-300 ease-in-out hover:scale-125"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className="text-sm font-semibold">
                      {capitalizeName(birthday?.first_name)}{" "}
                      {capitalizeName(birthday?.last_name)}
                    </span>
                    <span className="text-sm font-light">
                      {formatTimeAgoBirthDay(birthday?.date_of_birth)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
            <h2 className="text-sm font-semibold">{t("upcoming")}</h2>
            <br />
            <ul className="min-h-20">
              {birthDaysUpcoming.length === 0 && (
                <div className="flex justify-center items-center h-full">
                  <span className="text-sm font-light">
                    {t("no_upcoming_birthdays")}
                  </span>
                </div>
              )}
              {birthDaysUpcoming.map((birthday) => (
                <li
                  key={birthday?.id}
                  className="overflow-hidden flex gap-2 mb-6"
                >
                  <div className="overflow-hidden w-[45px] rounded-full">
                    <img
                      src={birthday?.profile_picture}
                      className="w-[45px] rounded-full transform transition-transform duration-300 ease-in-out hover:scale-125"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className="text-sm font-semibold">
                      {capitalizeName(birthday?.first_name)}{" "}
                      {capitalizeName(birthday?.last_name)}
                    </span>
                    <span className="text-sm font-light">
                      {formatTimeAgoBirthDay(birthday?.date_of_birth)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="w-full max-w-sm mx-auto shadow-sm rounded-2xl overflow-hidden">
          <CardHeader>
            <CardTitle>{t("recent_chats")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="overflow-y-scroll h-40 no_scrollbar">
              {recentChatsList.length === 0 && (
                <div className="flex justify-center items-center h-full">
                  <span className="text-sm font-light">
                    {t("no_recent_chats")}
                  </span>
                </div>
              )}
              {recentChatsList.map((birthday) => (
                <li key={birthday?.id} className="flex items-center gap-2 mb-6">
                  <div className="overflow-hidden w-[45px] rounded-full">
                    <img
                      src={birthday?.profile_picture}
                      className="w-[45px] rounded-full transform transition-transform duration-300 ease-in-out hover:scale-125"
                    />
                  </div>
                  <div className="">
                    <span className="text-sm font-semibold">
                      {capitalizeName(birthday?.first_name)}{" "}
                      {capitalizeName(birthday?.last_name)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <UpcomingEventsCard />
        <ContactsListCard />
      </div>
    </AsyncComponent>
  );
}
