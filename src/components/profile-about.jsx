import { Card } from "@/components/ui/card";
import { useState } from "react";

import EditBasicInfoForm from "@/components/edit-basic-info-form";
import EditContactForm from "@/components/edit-contact-form";
import EditAdditionalInfoForm from "@/components/edit-additional-info-form";
import EditEthinicityForm from "@/components/edit-ethinicity-form";
import EditEducationForm from "@/components/edit-education-form";
import EditInterestsForm from "@/components/edit-interests-form";
import { useWindowSize } from "@/hooks/useWindowSize";
import { useTranslation } from "react-i18next";

export const profileAbout = [
  {
    label: "basic_information",
    path: "basic-info",
  },
  {
    label: "contact",
    path: "contact",
  },
  {
    label: "additional",
    path: "additional-info",
  },
  {
    label: "ethinicity",
    path: "ethinicity",
  },
  {
    label: "education",
    path: "educations",
  },
  {
    label: "interests",
    path: "interests",
  },
];

export default function ProfileAbout() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("basic-info");
  const { width } = useWindowSize();

  const handleInfoTypeClick = (infoType) => {
    setActiveTab(infoType);
  };
  const renderContent = () => {
    if (width < 640) {
      return (
        <div className="flex flex-col gap-2 h-full col-span-12 md:col-span-8 lg:col-span-9">
          <EditBasicInfoForm />
          <EditContactForm />
          <EditAdditionalInfoForm />
          <EditEthinicityForm />
          <EditEducationForm />
          <EditInterestsForm />
        </div>
      );
    }
    switch (activeTab) {
      case "basic-info":
        return <EditBasicInfoForm />;
      case "contact":
        return <EditContactForm />;
      case "additional-info":
        return <EditAdditionalInfoForm />;
      case "ethinicity":
        return <EditEthinicityForm />;
      case "educations":
        return <EditEducationForm />;
      case "interests":
        return <EditInterestsForm />;
      default:
        return null;
    }
  };

  return (
    <div className="grid grid-cols-12 gap-4">
      {/* left side bar */}
      <div className="w-auto max-h-[345px] border-0 bg-brandPrimary rounded-xl hidden md:block md:col-span-4 lg:col-span-3">
        <div className="flex flex-col gap-2 p-2">
          {profileAbout.map(({ label, path }) => (
            <button
              key={path}
              onClick={() => handleInfoTypeClick(path)}
              className={`flex items-center gap-4 h-12 font-medium pl-2 rounded-xl text-dark-text ${
                activeTab === path
                  ? "bg-brandSecondary text-brandPrimary"
                  : "text-white hover:text-brandPrimary"
              } cursor-pointer  hover:bg-brandSecondary `}
            >
              {t(label)}
            </button>
          ))}
        </div>
      </div>
      {/* right side content */}
      <Card className="sm:p-2 h-full col-span-12 md:col-span-8 lg:col-span-9 sm:bg-brandSecondary shadow-none border-none">
        {renderContent()}
      </Card>
    </div>
  );
}
