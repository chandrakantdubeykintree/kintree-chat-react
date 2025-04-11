import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useWill } from "@/hooks/useWill";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card } from "../ui/card";
import { Plus, Search, User } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { useFamilyMembers } from "@/hooks/useFamily";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { cn } from "@/lib/utils";

export default function AddFamilyMemberDialog({ willId }) {
  const { t } = useTranslation();
  const { addMemberBeneficiaries, isAddingMemberBeneficiaries } = useWill();
  const familyMemberIdSchema = z.object({
    member_ids: z.array(z.number()).min(1, t("select_at_least_one_member")),
  });
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { data: familyMembers } = useFamilyMembers();
  const [filteredFamilyMembers, setFilteredFamilyMembers] = useState([]);

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

  const handleClose = () => {
    setIsOpen(false);
    setSearchQuery("");
  };

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(familyMemberIdSchema),
  });

  const handleCheckboxChange = (memberId) => {
    const currentValues = getValues("member_ids") || [];
    const newValues = currentValues.includes(memberId)
      ? currentValues.filter((id) => id !== memberId)
      : [...currentValues, memberId];

    setValue("member_ids", newValues, { shouldValidate: true });
  };

  const onSubmit = async (data) => {
    try {
      const response = await addMemberBeneficiaries({
        willId,
        memberIds: data.member_ids,
      });
      if (response.success) {
        // toast.success(t("member_added_successfully"));
        setIsOpen(false);
      } else {
        toast.error(t("error_failed_to_add_member"));
      }
    } catch (error) {
      toast.error(t("error_failed_to_add_member"));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="w-full sm:w-fit h-10 md:h-12 rounded-full">
          <Plus className="w-4 h-4 mr-2" />
          {t("add_beneficiary_family_member")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[90%] w-[650px] max-h-[90%] sm:h-[550px] p-0 rounded-2xl sm:rounded-2xl">
        <div className="flex flex-col h-full">
          <DialogHeader className="space-y-4 p-6 border-b">
            <DialogTitle className="text-xl font-semibold">
              {t("add_beneficiary_family_member")}
            </DialogTitle>
            <div className="flex items-center border bg-gray-100 rounded-full relative">
              <Search className="w-5 h-5 absolute left-2 z-10" />
              <Input
                className={cn(
                  "pl-10",
                  "w-full rounded-full border border-primary bg-background",
                  "text-sm ring-offset-background",
                  "file:border-0 file:bg-transparent file:text-sm file:font-medium",
                  "placeholder:text-muted-foreground",
                  "focus:outline-none focus:ring-1 focus:ring-primary focus:ring-offset-0",
                  "focus:border-primary",
                  "hover:border-primary/80"
                )}
                placeholder={t("search_family_members")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </DialogHeader>
          <div className="flex-1 p-6 overflow-hidden">
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-4 h-full"
            >
              <div className="space-y-4 overflow-y-auto flex-1 max-h-[300px] no_scrollbar">
                {familyMembers?.map((member) => (
                  <Card key={member.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex gap-4">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                          {member?.profile_picture ? (
                            <img
                              src={member?.profile_picture}
                              className="w-6 h-6 rounded-full"
                            />
                          ) : (
                            <User className="w-6 h-6 text-primary" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold">
                            {member?.first_name}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {member?.relation || "NA"}
                          </p>
                          <div className="text-sm text-gray-500 mt-1">
                            {member?.email && <div>{member?.email}</div>}
                            {member?.phone_no && (
                              <div>
                                {member?.phone_country_code} {member?.phone_no}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <Checkbox
                        id={`member-${member.id}`}
                        checked={getValues("member_ids")?.includes(member.id)}
                        onCheckedChange={() => handleCheckboxChange(member.id)}
                      />
                    </div>
                  </Card>
                ))}
              </div>
              <div className="flex justify-end mt-4 gap-4 border-t pt-4">
                <Button
                  className="rounded-full h-10 lg:h-12 px-4 lg:px-6"
                  variant="outline"
                  onClick={handleClose}
                  type="button"
                >
                  {t("cancel")}
                </Button>
                <Button
                  className="rounded-full h-10 lg:h-12 px-4 lg:px-6"
                  type="submit"
                  disabled={isAddingMemberBeneficiaries}
                >
                  {isAddingMemberBeneficiaries ? t("saving") : t("next")}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
