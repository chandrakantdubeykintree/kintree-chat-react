import { useFamilyMembers } from "@/hooks/useFamily";
import MemberCard from "./member-card";
import { Badge } from "@/components/ui/badge";
import ComponentLoading from "@/components/component-loading";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import AsyncComponent from "@/components/async-component";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

export default function ProfileMembers() {
  const { data: members, isLoading } = useFamilyMembers();
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [filterBy, setFilterBy] = useState("all");
  const { t } = useTranslation();
  useEffect(() => {
    function handleFilterMembers() {
      if (filterBy === "active") {
        setFilteredMembers(
          members?.filter((member) => member?.is_active === 1)
        );
      } else if (filterBy === "inactive") {
        setFilteredMembers(
          members?.filter((member) => member?.is_active === 0)
        );
      } else if (filterBy === "all") {
        setFilteredMembers(members);
      }
    }
    handleFilterMembers();
  }, [filterBy]);

  useEffect(() => {
    if (members) {
      setFilteredMembers(members);
    }
  }, [members]);

  if (isLoading) return <ComponentLoading />;

  if (!members)
    return (
      <div>
        <h1>{t("no_members")}</h1>
        <Button className="rounded-full">{t("add_members")}</Button>
      </div>
    );

  return (
    <AsyncComponent>
      <div className="flex gap-4 overflow-x-scroll no_scrollbar">
        <Badge
          className={cn(
            "py-2 px-4 cursor-pointer rounded-l-full rounded-r-full text-sm bg-indigo-950 whitespace-nowrap",
            filterBy === "all" ? "bg-brandPrimary text-white" : ""
          )}
          onClick={() => setFilterBy("all")}
        >
          {t("all")} ({members?.length || 0})
        </Badge>
        <Badge
          className={cn(
            "py-2 px-4 cursor-pointer rounded-l-full rounded-r-full text-sm bg-indigo-950 whitespace-nowrap",
            filterBy === "active" ? "bg-brandPrimary text-white" : ""
          )}
          onClick={() => setFilterBy("active")}
        >
          {t("active")} (
          {members?.filter((member) => member?.is_active === 1)?.length || 0})
        </Badge>
        <Badge
          className={cn(
            "py-2 px-4 cursor-pointer rounded-l-full rounded-r-full text-sm bg-indigo-950 whitespace-nowrap",
            filterBy === "inactive" ? "bg-brandPrimary text-white" : ""
          )}
          onClick={() => setFilterBy("inactive")}
        >
          {t("inactive")} (
          {members?.filter((member) => member?.is_active === 0)?.length || 0})
        </Badge>
      </div>
      {filteredMembers?.length > 0 ? (
        <div className="grid grid-col-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 bg-brandSecondary p-4 rounded-lg">
          {filteredMembers?.map((member) => (
            <MemberCard
              key={member.id}
              active={member?.is_active === 1 ? true : false}
              member={member}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-4">
          <img src="/illustrations/no_member_picture.png" />
          <p className="text-gray-400">
            {t("click_on_the_add_members_button_to_add_a_new_member")}
          </p>
        </div>
      )}
    </AsyncComponent>
  );
}
