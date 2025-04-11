import { useEffect, useState, useMemo } from "react";
import { useWill } from "@/hooks/useWill";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import AddBeneficiaryForm from "./AddBenificiaryForm";
import BeneficiaryCard from "./BeneficiaryCard";
import ComponentLoading from "../component-loading";
import AddFamilyMemberDialog from "./AddFamilyMemberDialog";
import { Input } from "../ui/input";
import { useFamilyMembers } from "@/hooks/useFamily";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

export default function Beneficiaries({ setStep, willId }) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("family");
  const [searchQuery, setSearchQuery] = useState("");
  const { data: familyMembers } = useFamilyMembers();
  const [isAddFamilyMemberDialogOpen, setIsAddFamilyMemberDialogOpen] =
    useState(false);
  const [isAddNonRelativeDialogOpen, setIsAddNonRelativeDialogOpen] =
    useState(false);
  const { getBeneficiariesQuery, isSavingAllocations } = useWill();

  const [filteredFamilyMembers, setFilteredFamilyMembers] = useState([]);

  const { data: beneficiariesData, isLoading } = getBeneficiariesQuery(willId);
  const memberBeneficiariesCount = beneficiariesData?.data?.filter(
    (item) => item.member_id
  );
  const nonMemberBeneficiariesCount = beneficiariesData?.data?.filter(
    (item) => !item.member_id
  );
  const beneficiaries = useMemo(
    () => beneficiariesData?.data || [],
    [beneficiariesData]
  );
  const [filteredBeneficiaries, setFilteredBeneficiaries] = useState([]);

  useEffect(() => {
    setFilteredBeneficiaries(
      beneficiaries.filter((item) =>
        activeTab === "family" ? item.member_id : !item.member_id
      )
    );
  }, [activeTab, beneficiaries]);

  const handleSaveAndContinue = async () => {
    setStep("allocation");
  };

  useEffect(() => {
    if (searchQuery !== "" && familyMembers) {
      setFilteredFamilyMembers(
        familyMembers.filter((member) =>
          member.first_name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    } else {
      setFilteredFamilyMembers(familyMembers);
    }
  }, [searchQuery, familyMembers]);

  if (isLoading) {
    return <ComponentLoading />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-start gap-4">
        <h2 className="text-xl font-semibold">{t("beneficiaries")}</h2>
        <div className="flex flex-wrap justify-start gap-4">
          {/* <Dialog
            open={isAddFamilyMemberDialogOpen}
            onOpenChange={setIsAddFamilyMemberDialogOpen}
          >
            <DialogTrigger asChild>
              <Button className="w-full sm:w-fit h-10 md:h-12 rounded-full">
                <Plus className="w-4 h-4 mr-2" />
                {t("add_beneficiary_family_member")}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[90%] w-[650px] max-h-[90%] overflow-y-auto no_scrollbar rounded-2xl sm:rounded-2xl">
              <DialogHeader className="space-y-4">
                <DialogTitle className="text-xl font-semibold">
                  {t("add_beneficiary_family_member")}
                </DialogTitle>
                <div className="flex items-center border bg-gray-100 rounded-full relative">
                  <Search className="w-5 h-5 absolute left-2 z-10" />
                  <Input
                    className={cn(
                      // Base styles
                      "pl-10",
                      "w-full rounded-full border border-primary bg-background",
                      "text-sm ring-offset-background",
                      "file:border-0 file:bg-transparent file:text-sm file:font-medium",
                      "placeholder:text-muted-foreground",
                      // Focus styles
                      "focus:outline-none focus:ring-1 focus:ring-primary focus:ring-offset-0",
                      "focus:border-primary",
                      // Hover styles
                      "hover:border-primary/80"
                    )}
                    placeholder={t("search_family_members")}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </DialogHeader>
              <AddFamilyMemberDialog
                willId={willId}
                onSuccess={() => setIsAddFamilyMemberDialogOpen(false)}
                familyMembers={filteredFamilyMembers}
                onCancel={() => setIsAddFamilyMemberDialogOpen(false)}
              />
            </DialogContent>
          </Dialog> */}
          <AddFamilyMemberDialog
            willId={willId}
            onSuccess={() => {
              // Handle success - maybe refetch data
            }}
          />
          <Dialog
            open={isAddNonRelativeDialogOpen}
            onOpenChange={setIsAddNonRelativeDialogOpen}
          >
            <DialogTrigger asChild>
              <Button
                className="w-full sm:w-fit h-10 lg:h-12 px-4 lg:px-6 rounded-full border-primary"
                variant="outline"
              >
                <Plus className="w-4 h-4 mr-2" />
                {t("add_non_relative")}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[90%] max-h-[90%] w-[450px]  overflow-y-scroll no_scrollbar rounded-2xl sm:rounded-2xl">
              <DialogHeader>
                <DialogTitle>{t("add_new_beneficary")}</DialogTitle>
              </DialogHeader>
              <AddBeneficiaryForm
                willId={willId}
                onSuccess={() => setIsAddNonRelativeDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="w-full flex justify-start h-[54px] gap-2 border-b border-gray-200 relative">
        <div
          className={`text-sm flex items-center cursor-pointer hover:bg-primary hover:text-white  px-4 ${
            activeTab === "family"
              ? "font-bold text-brandPrimary border-b-2 border-brandPrimary"
              : ""
          }`}
          onClick={() => {
            setActiveTab("family");
          }}
        >
          {t("family")} ({memberBeneficiariesCount?.length})
        </div>
        <div
          className={`text-sm flex items-center cursor-pointer hover:bg-primary hover:text-white px-4 ${
            activeTab === "non-relative"
              ? "font-bold text-brandPrimary border-b-2 border-brandPrimary"
              : ""
          }`}
          onClick={() => {
            setActiveTab("non-relative");
          }}
        >
          {t("non_relative")} ({nonMemberBeneficiariesCount?.length})
        </div>
      </div>

      {memberBeneficiariesCount.length === 0 && activeTab === "family" ? (
        <div className="text-center py-8 text-gray-500">
          {t("no_beneficiaries_added")}
        </div>
      ) : (
        activeTab === "family" && (
          <div className="space-y-4">
            {memberBeneficiariesCount.map((beneficiary) => (
              <BeneficiaryCard
                key={beneficiary.id}
                beneficiary={beneficiary}
                willId={willId}
                showPercentage={false}
              />
            ))}
          </div>
        )
      )}

      {nonMemberBeneficiariesCount.length === 0 &&
      activeTab === "non-relative" ? (
        <div className="text-center py-8 text-gray-500">
          {t("no_beneficiaries_added")}
        </div>
      ) : (
        activeTab !== "family" && (
          <div className="space-y-4">
            {nonMemberBeneficiariesCount.map((beneficiary) => (
              <BeneficiaryCard
                key={beneficiary.id}
                beneficiary={beneficiary}
                willId={willId}
                showPercentage={false}
              />
            ))}
          </div>
        )
      )}

      <div className="flex justify-end gap-4">
        <Button
          variant="outline"
          onClick={() => setStep("personal-info")}
          className="rounded-full h-10 md:h-12 px-4 lg:px-6"
        >
          {t("back")}
        </Button>
        <Button
          onClick={handleSaveAndContinue}
          disabled={isSavingAllocations || beneficiaries.length === 0}
          className="rounded-full h-10 md:h-12 px-4 lg:px-6"
        >
          {isSavingAllocations ? t("saving") : t("next")}
        </Button>
      </div>
    </div>
  );
}
