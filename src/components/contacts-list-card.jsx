import { useFamilyMembers } from "@/hooks/useFamily";
import ComponentLoading from "./component-loading";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { capitalizeName } from "@/utils/stringFormat";
import { useTranslation } from "react-i18next";

export default function ContactsListCard() {
  const { t } = useTranslation();
  const { data, isLoading } = useFamilyMembers();
  if (isLoading) return <ComponentLoading />;
  return (
    <Card className="w-full max-w-sm mx-auto shadow-sm rounded-2xl overflow-hidden">
      <CardHeader>
        <CardTitle>{t("family_members")}</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="overflow-y-scroll min-h-40 no_scrollbar">
          {data?.length === 0 && (
            <div className="flex justify-center items-center h-full">
              <span className="text-sm font-light">
                {t("no_family_members")}
              </span>
            </div>
          )}
          {data?.map((member) => (
            <li key={member?.id} className="flex items-center gap-2 mb-6">
              <div className="overflow-hidden w-[45px] max-w-[45px] max-h-[45px] rounded-full">
                <img
                  src={member?.profile_pic_url}
                  className="w-[45px] rounded-full transform transition-transform duration-300 ease-in-out hover:scale-125"
                />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm font-semibold">
                  {capitalizeName(member?.first_name)}{" "}
                  {capitalizeName(member?.last_name)}
                </span>
                <span className="text-sm font-light">{member?.relation}</span>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
