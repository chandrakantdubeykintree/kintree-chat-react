import { useFamily, useMember } from "@/hooks/useFamily";
import { Link, useParams } from "react-router";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { capitalizeName, getInitials } from "@/utils/stringFormat";
import AsyncComponent from "@/components/async-component";
import { Badge } from "@/components/ui/badge";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, Share2, Trash2, UserPlus } from "lucide-react";
import { useState } from "react";
import { DeleteConfirmationDialog } from "@/components/delete-member-dialog";
import { useAuth } from "@/context/AuthProvider";
import EditRelativeForm from "@/components/edit-relative-form";
import AddRelativeForm from "@/components/add-relative-form";
import { useTranslation } from "react-i18next";
import { decryptId } from "@/utils/encryption";

export default function FamilyMember() {
  const { id: encryptedId } = useParams();
  const id = decryptId(encryptedId);
  const { data: familyMember, isLoading, refetch } = useMember(id);
  const { user } = useAuth();
  const is_user_added_by_me = familyMember?.added_by?.id === user?.id;
  const [isEditing, setIsEditing] = useState(false);
  const [isAddingRelative, setIsAddingRelative] = useState(false);
  const { t } = useTranslation();

  const { data: familyTree } = useFamily();

  const familyMemberSelected = familyTree?.find((member) => member?.id === +id);

  const handleShareCredentials = () => {
    const credentials = `
      username: ${familyMember?.username},
      password: ${familyMember?.password},
    `;
    navigator.clipboard.writeText(credentials);
    toast.success(t("credentials_copied"));
  };

  const handleAddRelative = () => {
    setIsAddingRelative(true);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDelete = () => {
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    try {
      // Implement delete API call
      toast.success(t("delete_member_success"));
      // Navigate back or to appropriate page
    } catch (error) {
      toast.error(t("delete_member_error"));
    }
    setShowDeleteDialog(false);
  };

  const InfoSection = ({ title, children }) => (
    <div className="mb-8">
      <h2 className="text-lg font-semibold mb-4 text-primary">{title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>
    </div>
  );

  const InfoItem = ({ label, value }) => {
    // if (!value) return null;

    return (
      <div className="flex flex-col">
        <span className="text-sm text-gray-800 dark:text-gray-400">
          {label}
        </span>
        <span className="text-sm font-medium">{value || "--"}</span>
      </div>
    );
  };

  return (
    <AsyncComponent isLoading={isLoading}>
      <Card className="w-full shadow-sm border-0 rounded-2xl overflow-y-scroll h-full no_scrollbar">
        {/* Cover Image */}
        {!isEditing && !isAddingRelative ? (
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
            <div className="absolute left-1/2 bottom-0 transform -translate-x-1/2 translate-y-1/2">
              <div className="relative">
                <Avatar className="w-24 h-24 border-4 border-white">
                  <AvatarImage
                    src={familyMember?.basic_info?.profile_pic_url}
                    alt="Profile"
                  />
                  <AvatarFallback className="text-2xl">
                    {getInitials(familyMember?.basic_info?.first_name) +
                      " " +
                      getInitials(familyMember?.basic_info?.last_name)}
                  </AvatarFallback>
                </Avatar>
                {familyMember?.is_godfather && (
                  <div className="absolute -bottom-1 -right-0">
                    <img
                      src="/godFBadge.svg"
                      alt="Godfather Badge"
                      className="w-8 h-8"
                    />
                  </div>
                )}
              </div>
            </div>
            <div className="absolute top-4 left-4 h-4 w-4 flex items-center justify-center cursor-pointer rounded-full p-3 bg-primary border border-primary-foreground">
              <Link to="/familytree">
                <ArrowLeft className="w-5 h-5 text-primary-foreground" />
              </Link>
            </div>
          </div>
        ) : null}

        {isEditing ? (
          <EditRelativeForm
            id={familyMember?.id}
            first_name={familyMember?.basic_info?.first_name}
            middle_name={familyMember.basic_info.middle_name}
            last_name={familyMember.basic_info.last_name}
            email={familyMember.email}
            phone_no={familyMember.phone_no}
            is_alive={familyMember.is_alive}
            age_range_id={familyMember.age_range_id}
            native_place={familyMember.additional_info.native_place}
            onCancel={() => setIsEditing(false)}
            profile_pic_url={familyMember.profile_pic_url}
            onSuccess={() => {
              setIsEditing(false);
              refetch();
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
          <div className="mt-8 p-2 md:p-4 lg:p-6">
            {/* Basic Info Header */}
            <div className="text-center mb-4">
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
                    {t(familyMember?.relation)}
                  </Badge>
                ) : null}
                <Badge variant="outline" className="text-primary rounded-full">
                  {t(familyMember?.gender === "f" ? "female" : "male")}
                </Badge>
                <Badge
                  variant="outline"
                  className={
                    familyMember?.is_alive
                      ? "text-green-600 rounded-full"
                      : "text-red-600 rounded-full"
                  }
                >
                  {t(familyMember?.is_alive ? "alive" : "deceased")}
                </Badge>
              </div>
              {familyMember?.basic_info?.bio && (
                <p className="mt-4 text-gray-600">
                  {familyMember.basic_info.bio}
                </p>
              )}
            </div>

            <div className="flex justify-center mb-4">
              <Button
                variant="outline"
                className="flex items-center gap-2 rounded-full"
                onClick={handleAddRelative}
              >
                <UserPlus className="w-4 h-4" />
                {t("add_relative")}
              </Button>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-3 gap-4 mb-8 text-center">
              <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <p className="text-2xl font-bold">{familyMember?.post_count}</p>
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

            {/* Contact Information */}
            <InfoSection title={t("contact_information")}>
              <InfoItem label={t("email")} value={familyMember?.email} />
              <InfoItem label={t("phone")} value={familyMember?.phone_no} />
              <InfoItem label={t("username")} value={familyMember?.username} />
            </InfoSection>

            {/* Additional Information */}
            <InfoSection title={t("additional_information")}>
              <InfoItem
                label={t("birth_place")}
                value={familyMember?.additional_info?.birth_place}
              />
              <InfoItem
                label={t("native_place")}
                value={capitalizeName(
                  familyMember?.additional_info?.native_place
                )}
              />
              <InfoItem
                label={t("current_city")}
                value={familyMember?.additional_info?.current_city}
              />
              <InfoItem
                label={t("blood_group")}
                value={familyMember?.additional_info?.blood_group?.toUpperCase()}
              />
              <InfoItem
                label={t("occupation")}
                value={familyMember?.additional_info?.occupation}
              />
              <InfoItem
                label={t("relationship_status")}
                value={t(familyMember?.additional_info?.relationship_status)}
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

            {/* Regional Information */}
            <InfoSection title={t("regional_information")}>
              <InfoItem
                label={t("religion")}
                value={familyMember?.regional_info?.religion?.name}
              />
              <InfoItem
                label={t("caste")}
                value={familyMember?.regional_info?.caste?.name}
              />
              <InfoItem
                label={t("sub_caste")}
                value={familyMember?.regional_info?.sub_caste?.name}
              />
              <InfoItem
                label={t("gotra")}
                value={
                  familyMember?.regional_info?.gotra?.name ||
                  familyMember?.regional_info?.gotra
                }
              />
              <InfoItem
                label={t("sect")}
                value={
                  familyMember?.regional_info?.sect?.name ||
                  familyMember?.regional_info?.sect
                }
              />
            </InfoSection>

            {familyMember?.has_godfather && familyMember?.godfather && (
              <InfoSection title={t("godfather_information")}>
                <div className="col-span-2 flex items-center gap-4">
                  <Avatar className="w-12 h-12">
                    <AvatarImage
                      src={familyMember.godfather.profile_pic_url}
                      alt={familyMember.godfather.first_name}
                    />
                    <AvatarFallback>
                      {getInitials(familyMember.godfather.first_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">
                      {capitalizeName(familyMember.godfather.first_name)}{" "}
                      {capitalizeName(familyMember.godfather.middle_name)}{" "}
                      {capitalizeName(familyMember.godfather.last_name)}
                    </p>
                    {/* <p className="text-sm text-gray-500">
                      @{familyMember.godfather.username}
                    </p> */}
                    {/* <Badge
                      variant="outline"
                      className="mt-1 text-primary rounded-full"
                    >
                      {t(familyMember.godfather.relation)}
                    </Badge> */}
                  </div>
                </div>
              </InfoSection>
            )}

            {/* Godfather's Children */}
            {familyMember?.is_godfather &&
              familyMember?.godfather_childrens?.length > 0 && (
                <InfoSection title={t("god_children")}>
                  <div className="col-span-2 space-y-4">
                    {familyMember.godfather_childrens.map((child) => (
                      <div key={child.id} className="flex items-center gap-4">
                        <Avatar className="w-12 h-12">
                          <AvatarImage
                            src={child.profile_pic_url}
                            alt={child.first_name}
                          />
                          <AvatarFallback>
                            {getInitials(child.first_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {capitalizeName(child.first_name)}{" "}
                            {capitalizeName(child.middle_name)}{" "}
                            {capitalizeName(child.last_name)}
                          </p>
                          <p className="text-sm text-gray-500">
                            @{child.username}
                          </p>
                          {/* <Badge
                            variant="outline"
                            className="mt-1 text-primary rounded-full"
                          >
                            {t(child.relation)}
                          </Badge> */}
                        </div>
                      </div>
                    ))}
                  </div>
                </InfoSection>
              )}

            {/* Added By Information */}
            {familyMember?.added_by ? (
              <InfoSection title={t("added_by")}>
                <div className="col-span-2 flex items-center gap-4">
                  <Avatar className="w-12 h-12">
                    <AvatarImage
                      src={familyMember?.added_by?.profile_pic_url}
                      alt="Added by"
                    />
                    <AvatarFallback>
                      {getInitials(familyMember?.added_by?.first_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">
                      {capitalizeName(familyMember?.added_by?.first_name)}{" "}
                      {capitalizeName(familyMember?.added_by?.last_name)}
                    </p>
                    <p className="text-sm text-gray-500">
                      @{familyMember?.added_by?.username}
                    </p>
                  </div>
                </div>
              </InfoSection>
            ) : null}

            {/* Credentials Section */}
            {familyMember?.password &&
            !familyMember?.is_active &&
            familyMember?.is_alive ? (
              <div className="mb-8 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-primary">
                    {t("login_credentials")}
                  </h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleShareCredentials}
                    className="flex items-center gap-2 rounded-full"
                  >
                    <Share2 className="w-4 h-4" />
                    {t("share_credentials")}
                  </Button>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {t("username")}
                    </span>
                    <span className="font-medium">
                      {familyMember?.username}
                    </span>
                  </div>

                  <div className="flex flex-col">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {t("password")}
                    </span>
                    <span className="font-medium">
                      {familyMember?.password}
                    </span>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Action Buttons */}
            <div className="flex gap-4 mt-8 justify-end">
              {is_user_added_by_me && !familyMember?.is_active && (
                <Button
                  variant="outline"
                  className="flex items-center gap-2 rounded-full"
                  onClick={handleEdit}
                >
                  <Edit className="w-4 h-4" />
                  {t("edit")}
                </Button>
              )}
              {is_user_added_by_me && !familyMember?.is_active && (
                <Button
                  variant="destructive"
                  className="flex items-center gap-2 rounded-full"
                  onClick={handleDelete}
                >
                  <Trash2 className="w-4 h-4" />
                  {t("delete")}
                </Button>
              )}
            </div>
          </div>
        )}
      </Card>

      {showDeleteDialog ? (
        <DeleteConfirmationDialog
          isOpen={showDeleteDialog}
          onClose={() => setShowDeleteDialog(false)}
          memberId={familyMember?.id}
          onConfirm={handleConfirmDelete}
          memberName={`${familyMember?.basic_info?.first_name} ${familyMember?.basic_info?.last_name}`}
        />
      ) : null}
    </AsyncComponent>
  );
}
