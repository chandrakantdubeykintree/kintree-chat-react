import { useWill } from "../hooks/useWill";
import { Button } from "@/components/ui/button";
import { PlusCircle, FileText, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router";
import { Skeleton } from "@/components/ui/skeleton";

import { Card } from "@/components/ui/card";
import { useState } from "react";
import ConfirmCreateNewWillDialog from "@/components/will/ConfirmCreateNewWillDialog";
import { useTranslation } from "react-i18next";

export default function Will() {
  const { t } = useTranslation();
  const { willData, isWillLoading, deleteWill } = useWill();
  const [showCreateWillDialog, setShowCreateWillDialog] = useState(false);
  const navigate = useNavigate();
  if (isWillLoading) {
    return <WillSkeleton />;
  }

  const handleCreateWill = () => {
    if (willData?.data?.id) {
      setShowCreateWillDialog(true);
    } else {
      navigate(`/will/create-will`);
    }
  };

  const handleConfirmNewWill = async () => {
    await deleteWill(willData?.data?.id);
  };

  return (
    <Card className="bg-background rounded-2xl h-full p-6 overflow-y-scroll no_scrollbar">
      <div className="bg-brandSecondary rounded-lg shadow-md p-4 mb-4">
        <h1 className="text-2xl font-bold mb-4">{t("get_started")}</h1>
        <p className="text-gray-600 dark:text-gray-200 mb-2">
          {t("get_started_will_description")}
        </p>
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-violet-100 dark:bg-[#000D38] rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-4 mb-4">
              <PlusCircle className="w-8 h-8 text-primary" />
              <h2 className="text-xl font-semibold">{t("create_new_will")}</h2>
            </div>
            <p className="text-gray-600 mb-4 dark:text-white">
              {t("create_new_will_description")}
            </p>
            <div className="flex gap-2">
              <Button
                onClick={handleCreateWill}
                className="rounded-full h-10 md:h-12 px-4 md:px-6"
              >
                {t("create_will")}
              </Button>
              <Button
                onClick={() => navigate(`/will/edit-will`)}
                disabled={!willData?.data?.id}
                variant="outline"
                className="rounded-full h-10 md:h-12 px-4 md:px-6 dark:bg-white dark:text-black"
              >
                {t("edit_will")}
              </Button>
            </div>
          </div>

          <div className="bg-orange-100 dark:bg-[#5E3500] rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-4 mb-4">
              <FileText className="w-8 h-8 text-primary" />
              <h2 className="text-xl font-semibold">
                {t("view_existing_will")}
              </h2>
            </div>
            <p className="text-gray-600 mb-4 dark:text-white">
              {t("view_existing_will_description")}
            </p>
            <Button
              variant={willData?.data ? "default" : "secondary"}
              disabled={!willData?.data || willData?.data?.completed_status < 4}
              onClick={() => navigate(`/will/view-will`)}
              className="rounded-full h-10 md:h-12 px-4 md:px-6"
            >
              {t("view_will")}
            </Button>
          </div>
        </div>
      </div>

      {willData?.data && (
        <div className="bg-gray-100 dark:bg-[#171717] rounded-lg p-6 shadow-md mb-4">
          <h2 className="text-xl font-semibold mb-4">{t("my_will")}</h2>
          <div className="grid gap-4">
            <div className="flex justify-between items-center bg-gray-300 dark:bg-[#D1D5DB] p-4 rounded-lg">
              <span className="text-gray-600 dark:text-[#5E5F60] font-semibold">
                {t("completion_status")}:
              </span>
              <span className="font-semibold dark:text-background">
                {Math.floor((willData?.data?.completed_status / 5) * 100)}%
              </span>
            </div>
            <div className="flex justify-between items-center bg-gray-300 dark:bg-[#D1D5DB] p-4 rounded-lg">
              <span className="text-gray-600 dark:text-[#5E5F60] font-semibold">
                {t("notarized")}:
              </span>
              <span className="font-medium dark:text-background">
                {willData?.data?.is_notarized ? "Yes" : "No"}
              </span>
            </div>
            <div className="flex justify-between items-center bg-gray-300 dark:bg-[#D1D5DB] p-4 rounded-lg">
              <span className="text-gray-600 dark:text-[#5E5F60] font-semibold">
                {t("last_updated")}:
              </span>
              <span className="font-medium dark:text-background">
                {willData?.data?.updated_at
                  ? new Date(willData?.data?.updated_at).toLocaleDateString()
                  : "NA"}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="bg-indigo-100 dark:bg-[#000D38] rounded-lg shadow-md p-4">
        <h2 className="text-xl font-bold mb-4">{t("whats_in_it_for_you")}</h2>
        <div className="grid gap-4">
          <div className="flex justify-start items-center gap-4 bg-gray-100 dark:bg-[#D1D5DB]  p-4 rounded-lg">
            <CheckCircle className="w-8 h-8 text-primary" />
            <span className="text-gray-600 dark:text-[#5E5F60]">
              {t("completely_free")}
            </span>
          </div>
          <div className="flex justify-start items-center gap-4 bg-gray-100 dark:bg-[#D1D5DB]  p-4 rounded-lg">
            <CheckCircle className="w-8 h-8 text-primary" />
            <span className="text-gray-600 dark:text-[#5E5F60]">
              {t("secure_and_hasle_free")}
            </span>
          </div>
          <div className="flex justify-start items-center gap-4 bg-gray-100 dark:bg-[#D1D5DB]  p-4 rounded-lg">
            <CheckCircle className="w-8 h-8 text-primary" />
            <span className="text-gray-600 dark:text-[#5E5F60]">
              {t("from_comfort_of_your_home")}
            </span>
          </div>
        </div>
      </div>
      <ConfirmCreateNewWillDialog
        showConfirmDialog={showCreateWillDialog}
        setShowConfirmDialog={setShowCreateWillDialog}
        handleConfirmNewWill={handleConfirmNewWill}
      />
    </Card>
  );
}

const WillSkeleton = () => (
  <div className="p-6">
    <Skeleton className="h-8 w-48 mb-6" />
    <div className="grid md:grid-cols-2 gap-6">
      <Skeleton className="h-[200px]" />
      <Skeleton className="h-[200px]" />
    </div>
  </div>
);
