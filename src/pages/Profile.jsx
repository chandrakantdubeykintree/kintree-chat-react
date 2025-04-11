import ProfileAbout from "@/components/profile-about";
import ProfileGallery from "@/components/profile-gallery";
import ProfileMembers from "@/components/profile-members";
import AsyncComponent from "@/components/async-component";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useProfile } from "@/hooks/useProfile";
import { getInitials } from "@/utils/stringFormat";
import { Card } from "@/components/ui/card";
import { ICON_EDIT } from "@/constants/iconUrls";
import ImageUploadModal from "@/components/image-upload-modal";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";

export default function Profile() {
  const { t } = useTranslation();
  const { profile: user } = useProfile("/user/profile");
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "about";

  const handleTabChange = (newTab) => {
    setSearchParams({ tab: newTab });
  };

  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [uploadType, setUploadType] = useState(null);

  const openImageModal = (type) => {
    setUploadType(type);
    setIsImageModalOpen(true);
  };

  function renderTabContent() {
    switch (activeTab) {
      case "about":
        return <ProfileAbout />;
      case "gallery":
        return <ProfileGallery />;
      case "members":
        return <ProfileMembers />;
      default:
        return <ProfileAbout />;
    }
  }

  return (
    <AsyncComponent>
      <Card className="w-full shadow-sm border-0 rounded-2xl h-full overflow-y-scroll no_scrollbar">
        <div
          className="relative w-full h-[120px] md:h-[150px] lg:h-[200px] bg-cover bg-center rounded-t-2xl"
          style={{
            backgroundImage: `url(${
              user?.basic_info?.profile_cover_pic_url ||
              "/illustrations/illustration_bg.png"
            })`,
          }}
        >
          <Button
            variant="outline"
            className="absolute top-2 right-2 rounded-full flex items-center gap-1 border-white bg-gray-100 dark:bg-gray-800"
            onClick={() => openImageModal("cover")}
          >
            <img src={ICON_EDIT} className="w-4 h-4" />
            <span className="text-md">{t("edit")}</span>
          </Button>
          {/* Profile Image */}
          <div className="w-[60px] h-[60px] md:w-[80px] md:h-[80px] lg:w-[120px] lg:h-[120px] border-brandPrimary rounded-full absolute z-1 bottom-[-25%] left-[5%] border-[2px] overflow-hidden group bg-background">
            <Avatar className="rounded-full border-2 transition-transform duration-300 ease-in-out group-hover:scale-105 w-full h-full">
              <AvatarImage
                src={user?.basic_info?.profile_pic_url}
                alt="@shadcn"
              />
              <AvatarFallback className="rounded-full text-2xl font-normal text-center w-full h-full">
                {getInitials(user?.basic_info?.first_name) +
                  " " +
                  getInitials(user?.basic_info?.last_name)}
              </AvatarFallback>
            </Avatar>
            {/* Profile Image Edit Overlay */}
            <div
              className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity"
              onClick={() => openImageModal("profile")}
            >
              <img src={ICON_EDIT} className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="grid gap-4 grid-cols-1 mt-16 mb-4 px-4">
          <div className="flex justify-start h-[54px] gap-2 border-b relative">
            <div
              className={`text-sm flex items-center cursor-pointer hover:bg-primary/90 hover:text-white hover:font-semibold hover:rounded-lg px-4 ${
                activeTab === "about"
                  ? "font-bold text-brandPrimary border-b-2 border-brandPrimary"
                  : ""
              }`}
              onClick={() => handleTabChange("about")}
            >
              {t("about")}
            </div>
            <div
              className={`text-sm flex items-center cursor-pointer hover:bg-primary/90 hover:text-white hover:font-semibold hover:rounded-lg px-4 ${
                activeTab === "gallery"
                  ? "font-bold text-brandPrimary border-b-2 border-brandPrimary"
                  : ""
              }`}
              onClick={() => handleTabChange("gallery")}
            >
              {t("gallery")}
            </div>
            <div
              className={`text-sm flex items-center cursor-pointer hover:bg-primary/90 hover:text-white hover:font-semibold hover:rounded-lg px-4 ${
                activeTab === "members"
                  ? "font-bold text-brandPrimary border-b-2 border-brandPrimary"
                  : ""
              }`}
              onClick={() => handleTabChange("members")}
            >
              {t("members")}
            </div>
          </div>
          {renderTabContent()}
        </div>
      </Card>
      <ImageUploadModal
        isOpen={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
        type={uploadType}
      />
    </AsyncComponent>
  );
}
