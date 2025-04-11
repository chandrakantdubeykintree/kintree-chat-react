import { useFamily, useMember } from "@/hooks/useFamily";
import { NavLink, useNavigate, useParams } from "react-router";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { capitalizeName, getInitials } from "@/utils/stringFormat";
import AsyncComponent from "@/components/async-component";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import EditRelativeForm from "@/components/edit-relative-form";
import AddRelativeForm from "@/components/add-relative-form";
import ComponentLoading from "@/components/component-loading";
import { decryptId } from "@/utils/encryption";
import { useTranslation } from "react-i18next";
// import { Button } from "@/components/ui/button";
// import MergeRequestForm from "@/components/merge-request-form";
// import { useCancelMergeRequest } from "@/hooks/useMergeTree";
// import { useMergeRelationTypes } from "@/hooks/useMasters";
// import { useAuth } from "@/context/AuthProvider";

const formatDate = (dateString) => {
  if (!dateString) return "--";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "--";
  return date
    .toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
    .replace(/\//g, "-");
};

export default function KintreeMember() {
  const { t } = useTranslation();
  const { id: encryptedId } = useParams();
  // const [isMergeRequsetSent, setIsMergeRequestSent] = useState(false);
  const navigate = useNavigate();
  const id = decryptId(encryptedId);
  // const { user: profile } = useAuth();

  useEffect(() => {
    const id = decryptId(encryptedId);
    if (!id) {
      navigate("/familytree", { replace: true });
    }
  }, [encryptedId, navigate]);

  // const { data: mergeRelationType } = useMergeRelationTypes();

  const { data: familyMember, isLoading } = useMember(id);

  const [isEditing, setIsEditing] = useState(false);
  const [isAddingRelative, setIsAddingRelative] = useState(false);
  // const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);

  const { data: familyTree } = useFamily();

  // const { mutate: cancelMergeRequest, isLoading: isCancelling } =
  //   useCancelMergeRequest();

  const familyMemberSelected = familyTree?.find((member) => member?.id === +id);

  const InfoSection = ({ title, children }) => (
    <div className="mb-8">
      <h2 className="text-lg font-semibold mb-4 text-primary">{title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>
    </div>
  );

  const InfoItem = ({ label, value }) => {
    return (
      <div className="flex flex-col">
        <span className="text-sm text-gray-800 dark:text-gray-400">
          {label}
        </span>
        <span className="text-sm font-medium">{value || "--"}</span>
      </div>
    );
  };

  if (isLoading) {
    return <ComponentLoading />;
  }

  return (
    <AsyncComponent>
      <div className="w-full">
        <Card className="w-full shadow-sm border-0 rounded-2xl overflow-hidden">
          <div
            className="relative w-full h-[200px] bg-cover bg-center"
            style={{
              backgroundImage: `url(${
                familyMember?.profile_cover_pic_url ||
                "/illustrations/illustration_bg.png"
              })`,
            }}
          >
            {/* Profile Image */}
            <Avatar className="absolute left-1/2 bottom-0 transform -translate-x-1/2 translate-y-1/2 w-24 h-24 border-4 border-white">
              <AvatarImage src={familyMember?.profile_pic_url} alt="Profile" />
              <AvatarFallback className="text-2xl">
                {getInitials(familyMember?.basic_info?.first_name) +
                  " " +
                  getInitials(familyMember?.basic_info?.last_name)}
              </AvatarFallback>
            </Avatar>

            <div className="absolute top-4 left-4 h-4 w-4 flex items-center justify-center cursor-pointer rounded-full p-3 bg-primary border border-primary-foreground">
              <NavLink to={-1}>
                <ArrowLeft className="w-5 h-5 text-primary-foreground" />
              </NavLink>
            </div>
          </div>

          {isEditing ? (
            <EditRelativeForm
              id={familyMember.id}
              first_name={familyMember.basic_info.first_name}
              middle_name={familyMember.basic_info.middle_name}
              last_name={familyMember.basic_info.last_name}
              email={familyMember.email}
              phone_no={familyMember.phone_no}
              is_alive={familyMember.is_alive}
              age_range_id={familyMember.age_range_id}
              onCancel={() => setIsEditing(false)}
              onSuccess={() => {
                setIsEditing(false);
              }}
            />
          ) : isAddingRelative ? (
            <AddRelativeForm
              id={familyMemberSelected?.id}
              fid={familyMemberSelected?.fid}
              mid={familyMemberSelected?.mid}
              pid={familyMemberSelected?.pids[0]}
              gender={familyMemberSelected?.gender}
              onCancel={() => setIsAddingRelative(false)}
              onSuccess={() => {
                setIsAddingRelative(false);
                // Optionally refresh data
              }}
            />
          ) : (
            /* Existing profile view JSX */
            <div className="mt-16 p-2 md:p-4 lg:p-6">
              {/* Basic Info Header */}
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold">
                  {capitalizeName(familyMember?.basic_info?.first_name)}{" "}
                  {capitalizeName(familyMember?.basic_info?.middle_name)}{" "}
                  {capitalizeName(familyMember?.basic_info?.last_name)}
                </h1>
                <p className="text-gray-600">@{familyMember?.username}</p>
                <div className="flex gap-2 justify-center mt-2">
                  {familyMember?.relation ? (
                    <Badge
                      variant="outline"
                      className="text-primary rounded-full"
                    >
                      {familyMember?.relation}
                    </Badge>
                  ) : null}
                  {familyMember?.gender ? (
                    <Badge
                      variant="outline"
                      className="text-primary rounded-full"
                    >
                      {familyMember?.gender === "f" ? t("female") : t("male")}
                    </Badge>
                  ) : null}
                  <Badge
                    variant="outline"
                    className={
                      familyMember?.is_alive
                        ? "text-green-600 rounded-full"
                        : "text-red-600 rounded-full"
                    }
                  >
                    {familyMember?.is_alive ? t("alive") : t("deceased")}
                  </Badge>
                </div>
                {familyMember?.basic_info?.bio && (
                  <p className="mt-4 text-gray-600">
                    {familyMember.basic_info.bio}
                  </p>
                )}
              </div>
              {/* merge tree hidden for now */}
              <div className="flex justify-center mb-8">
                {/* {!familyMember?.is_relative &&
                !familyMember?.is_request_sent &&
                !familyMember?.is_request_received &&
                !isMergeRequsetSent ? (
                  <Button
                    onClick={() => setIsMergeModalOpen(true)}
                    className="flex items-center gap-2 rounded-full"
                  >
                    {t("request_merge")}
                  </Button>
                ) : null} */}
                {/* {!familyMember?.is_relative &&
                familyMember?.is_request_received ? (
                  <Button
                    onClick={() => {
                      cancelMergeRequest(familyMember.merge_request_id, {
                        onSuccess: () => {},
                      });
                    }}
                    variant="outline"
                    disabled={isCancelling}
                    className="flex items-center gap-2 rounded-full border border-primary text-primary"
                  >
                    {isCancelling ? "Cancelling..." : "Cancel Tree Merge"}
                  </Button>
                ) : null} */}
              </div>

              {/* Statistics */}
              <div className="grid grid-cols-3 gap-4 mb-8 text-center">
                <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  <p className="text-2xl font-bold">
                    {familyMember?.post_count}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t("posts")}
                  </p>
                </div>
                <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  <p className="text-2xl font-bold">
                    {familyMember?.event_count}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t("events")}
                  </p>
                </div>
                <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  <p className="text-2xl font-bold">
                    {familyMember?.attachments?.length || 0}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t("attachments")}
                  </p>
                </div>
              </div>

              {/* Basic Information */}
              <InfoSection title={t("basic_info")}>
                <InfoItem
                  label={t("first_name")}
                  value={capitalizeName(familyMember?.basic_info?.first_name)}
                />
                <InfoItem
                  label={t("middle_name")}
                  value={
                    capitalizeName(familyMember?.basic_info?.middle_name) ||
                    "--"
                  }
                />
                <InfoItem
                  label={t("last_name")}
                  value={capitalizeName(familyMember?.basic_info?.last_name)}
                />
                <InfoItem
                  label={t("date_of_birth")}
                  value={formatDate(familyMember?.basic_info?.date_of_birth)}
                />
                <InfoItem
                  label={t("gender")}
                  value={t(
                    familyMember?.basic_info?.gender === "m" ? "male" : "female"
                  )}
                />
                <InfoItem
                  label={t("nickname")}
                  value={familyMember?.basic_info?.nickname || "--"}
                />
                <InfoItem
                  label={t("username")}
                  value={familyMember?.basic_info?.username}
                />
              </InfoSection>

              {/* Additional Information */}
              <InfoSection title={t("additional_info")}>
                <InfoItem
                  label={t("birth_place")}
                  value={familyMember?.additional_info?.birth_place}
                />
                <InfoItem
                  label={t("native_place")}
                  value={familyMember?.additional_info?.native_place}
                />
                <InfoItem
                  label={t("current_city")}
                  value={familyMember?.additional_info?.current_city}
                />
                <InfoItem
                  label={t("blood_group")}
                  value={familyMember?.additional_info?.blood_group}
                />
                <InfoItem
                  label={t("occupation")}
                  value={familyMember?.additional_info?.occupation}
                />
                <InfoItem
                  label={t("relationship_status")}
                  value={familyMember?.additional_info?.relationship_status}
                />
                <InfoItem
                  label={t("mother_tongue")}
                  value={familyMember?.additional_info?.mother_tongue}
                />
                {familyMember?.additional_info?.known_languages?.length > 0 && (
                  <InfoItem
                    label={t("known_languages")}
                    value={familyMember.additional_info.known_languages
                      .map((lang) => lang.name)
                      .join(", ")}
                  />
                )}
              </InfoSection>
            </div>
          )}
        </Card>
      </div>
      {/* {isMergeModalOpen ? (
        <MergeRequestForm
          isOpen={isMergeModalOpen}
          onClose={() => setIsMergeModalOpen(false)}
          userId={familyMember?.id}
          familyMembers={familyMember?.members}
          mergeRelationType={mergeRelationType}
          setIsMergeRequestSent={setIsMergeRequestSent}
          currentUser={familyMember}
          profile={profile}
        />
      ) : null} */}
    </AsyncComponent>
  );
}
