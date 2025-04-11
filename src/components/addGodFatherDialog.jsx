import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTranslation } from "react-i18next";
import { useEffect, useMemo, useState } from "react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { useCreateGodfather, useFamilyMembers } from "@/hooks/useFamily";
import { capitalizeName } from "@/utils/stringFormat";
import CustomScrollArea from "./ui/custom-scroll-area";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { Input } from "./ui/input";
import { Check, Search } from "lucide-react";
import ConfirmGodfatherDialog from "./confirmGodFatherDialog";
import SuccessGodfatherDialog from "./successGodFatherDialog";
import { useAuth } from "@/context/AuthProvider";
import ProfileImageUpload from "./profileImageUpload";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";

export default function AddGodFatherDialog({
  open,
  onClose,
  hasChildren,
  myGodfather,
  childrenGodfather,
}) {
  const { t } = useTranslation();
  const [selectedFor, setSelectedFor] = useState(null);
  const [selectedFrom, setSelectedFrom] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [hasPartner, setHasPartner] = useState(false);
  const [userChildren, setUserChildren] = useState([]);
  const { data: familyMembers, refetch: refetchFamilyMembers } =
    useFamilyMembers();
  const { user } = useAuth();

  const [step, setStep] = useState(1);
  const [selectedMember, setSelectedMember] = useState(null);
  const {
    assignFamilyGodfather,
    createNewGodfather,
    isLoading: isCreating,
  } = useCreateGodfather();

  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (open) {
      refetchFamilyMembers();
    }
  }, [open, refetchFamilyMembers]);

  useEffect(() => {
    if (familyMembers && user) {
      // Check if user is a parent (has fid or mid in any member)
      const isParent = familyMembers.find(
        (member) =>
          member.relation?.toLowerCase() === "wife" ||
          member.relation?.toLowerCase() === "husband"
      );
      setHasPartner(isParent);

      // Get all children where user is parent
      const children = familyMembers
        .filter(
          (member) =>
            member.relation?.toLowerCase() === "daughter" ||
            member.relation?.toLowerCase() === "son"
        )
        .filter((child) => !child?.has_godfather);

      setUserChildren(children);
    }
  }, [familyMembers, user]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm({
    defaultValues: {
      first_name: "",
      middle_name: "",
      last_name: "",
      gender: "",
      profile_image: null,
      phone_no: "",
      email: "",
    },
  });

  const handleContinue = () => {
    if (selectedFor && selectedFrom) {
      setStep(2);
    }
  };
  const handleImageUpload = (file) => {
    setValue("profile_image", file);
  };
  const onSubmit = async (data) => {
    if (selectedFrom === "family") {
      if (!selectedMember) {
        toast.error(t("please_select_member"));
        return;
      }
    } else {
      if (!data.first_name || !data.last_name || !data.gender) {
        if (!data.gender) {
          toast.error(t("select_gender"));
        }
        return;
      }
    }

    setShowConfirmation(true);
  };

  const handleConfirm = async () => {
    try {
      if (selectedFrom === "family") {
        const userIds =
          selectedFor === "myself"
            ? [user.id] // For myself
            : selectedFor === "children"
            ? userChildren.map((child) => child.id) // For all children
            : [];
        const response = await assignFamilyGodfather({
          user_ids: userIds,
          godfatherId: selectedMember.id,
        });

        if (response?.success) {
          setShowConfirmation(false);
          setShowSuccess(true);
        }
      } else {
        const formData = new FormData();
        formData.append("first_name", watch("first_name"));
        formData.append("middle_name", watch("middle_name"));
        formData.append("last_name", watch("last_name"));
        formData.append("gender", watch("gender"));
        formData.append("is_alive", 1);

        const phone = watch("phone_no");
        if (phone) {
          formData.append("phone_no", phone);
        }

        const email = watch("email");
        if (email) {
          formData.append("email", email);
        }

        const profilePicture = watch("profile_image");
        if (profilePicture) {
          formData.append("profile_image", profilePicture);
        }

        if (selectedFor === "myself") {
          formData.append("user_ids[]", user.id);
        } else if (selectedFor === "children" && userChildren.length > 0) {
          userChildren.forEach((child) => {
            formData.append("user_ids[]", child.id);
          });
        }

        const response = await createNewGodfather({
          userId: user.id,
          data: formData,
        });

        if (response?.success) {
          setShowConfirmation(false);
          setShowSuccess(true);
        }
      }
    } catch (error) {
      console.error("Error adding godfather:", error);
      toast.error(t("error_adding_godfather"));
      setShowConfirmation(false);
    }
  };

  const validRelationsForMyself = [
    "grandfather",
    "grandmother",
    "uncle",
    "aunt",
    "stepfather",
    "stepmother",
    "great grandfather",
    "great grandmother",
    "maternal uncle",
    "maternal aunt",
    "aunt (bua)",
    "uncle (fufa)",
    "aunt (mausi)",
    "uncle (mausa)",
    "grandfather(nana)",
    "grandmother(nani)",
    "father-in-law",
    "mother-in-law",
  ];

  const validRelationsForChildren = [
    "father",
    "mother",
    "grandfather",
    "grandmother",
    "uncle",
    "aunt",
    "stepfather",
    "stepmother",
    "great grandfather",
    "great grandmother",
    "maternal uncle",
    "maternal aunt",
    "aunt (bua)",
    "uncle (fufa)",
    "aunt (mausi)",
    "uncle (mausa)",
    "grandfather(nana)",
    "grandmother(nani)",
    "father-in-law",
    "mother-in-law",
    "brother",
    "sister",
    "nephew",
    "niece",
    "stepbrother",
    "stepsister",
    "cousin brother",
    "cousin sister",
    "brother-in-law",
    "sister-in-law",
    "",
  ];

  const filteredMembers = useMemo(() => {
    // First filter all members for is_alive
    const aliveMembers =
      familyMembers?.filter(
        (member) =>
          member &&
          member.is_alive === 1 &&
          member.first_name &&
          member.id !== user.id &&
          member.id !== user.fid &&
          member.id !== user.mid
      ) || [];

    // Filter based on selectedFor
    const validRelations =
      selectedFor === "myself"
        ? validRelationsForMyself
        : selectedFor === "children"
        ? validRelationsForChildren
        : [];

    const validMembers = aliveMembers.filter((member) =>
      validRelations.includes(member.relation?.toLowerCase())
    );

    // If no search query, return all valid members
    if (!searchQuery.trim()) return validMembers;

    // Search within valid members
    return validMembers.filter((member) => {
      const fullName = [member.first_name, member.middle_name, member.last_name]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return fullName.includes(searchQuery.toLowerCase());
    });
  }, [familyMembers, searchQuery, user.id, selectedFor]);

  const buttonStyles = cn(
    "rounded-full h-[56px] text-lg flex items-center gap-2 transition-all",
    "hover:bg-primary hover:border-primary hover:text-primary-foreground dark:hover:text-primary-foreground",
    "[&>img]:dark:brightness-0 [&>img]:dark:invert"
  );

  const selectedStyles =
    "bg-primary border-primary text-primary-foreground [&>img]:brightness-0 [&>img]:invert";
  const unselectedStyles =
    "[&>img]:transition-all hover:bg-primary hover:border-primary hover:text-primary-foreground [&>img]:hover:brightness-0 [&>img]:hover:invert";

  const renderSecondStep = () => {
    if (selectedFrom === "family") {
      return (
        <>
          <DialogHeader className="p-6 border-b flex items-center justify-between sticky top-0 z-10 bg-background">
            <DialogTitle>{t("add_godfather")}</DialogTitle>
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-x h-4 w-4 [.kinterms-dialog_&]:text-black [.kinterms-dialog_&]:dark:text-black [.kinterms-dialog_&]:border rounded-full [.kinterms-dialog_&]:p-1 [.kinterms-dialog_&]:h-8 [.kinterms-dialog_&]:w-8 [.kinterms-dialog_&]:bg-white"
              >
                <path d="M18 6 6 18"></path>
                <path d="m6 6 12 12"></path>
              </svg>
              <span className="sr-only">Close</span>
            </button>
          </DialogHeader>
          <div className="space-y-4 px-6 pt-6">
            <div className="relative">
              <Input
                type="text"
                placeholder={t("search_members")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="rounded-full h-12 pl-12 border-gray-500"
              />
              <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 opacity-50" />
            </div>
          </div>
          <div className="py-2 m-6 mb-0 rounded-2xl">
            <CustomScrollArea maxHeight="300px">
              <ul className="overflow-y-scroll min-h-40 no_scrollbar">
                {filteredMembers?.length === 0 ? (
                  <div className="flex justify-center items-center h-full">
                    <span className="text-sm font-light">
                      {searchQuery
                        ? t("no_search_results")
                        : t("no_family_members")}
                    </span>
                  </div>
                ) : (
                  filteredMembers?.map((member) => (
                    <li
                      key={member?.id}
                      className={cn(
                        "flex items-center gap-4 mb-1 p-2 rounded-xl cursor-pointer transition-colors hover:bg-primary/5",
                        selectedMember?.id === member.id && "bg-primary/10"
                      )}
                      onClick={() => {
                        setSelectedMember(member);
                      }}
                    >
                      <div className="flex items-center gap-2 flex-1">
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
                          <span className="text-sm font-light">
                            {member?.relation}
                          </span>
                        </div>
                      </div>
                      <div
                        className={cn(
                          "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
                          selectedMember?.id === member.id
                            ? "bg-primary border-primary"
                            : "border-primary"
                        )}
                      >
                        {selectedMember?.id === member.id && (
                          <Check className="w-3 h-3 text-white stroke-[3]" />
                        )}
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </CustomScrollArea>
          </div>
        </>
      );
    }

    return (
      <>
        <DialogHeader className="p-6 border-b flex items-center justify-between sticky top-0 z-10 bg-background">
          <DialogTitle className="">{t("add_godfather")}</DialogTitle>
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-x h-4 w-4 [.kinterms-dialog_&]:text-black [.kinterms-dialog_&]:dark:text-black [.kinterms-dialog_&]:border rounded-full [.kinterms-dialog_&]:p-1 [.kinterms-dialog_&]:h-8 [.kinterms-dialog_&]:w-8 [.kinterms-dialog_&]:bg-white"
            >
              <path d="M18 6 6 18"></path>
              <path d="m6 6 12 12"></path>
            </svg>
            <span className="sr-only">Close</span>
          </button>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 px-6">
          <div className="flex flex-col items-center gap-4">
            <div className="text-[16px] font-semibold self-start">
              {t("personal_information")}
            </div>

            <ProfileImageUpload
              value={watch("profile_image")}
              onChange={handleImageUpload}
              firstName={watch("first_name")}
              lastName={watch("last_name")}
            />
            <div className="flex-1 space-y-4 w-full">
              <div className="grid gap-4">
                <Input
                  {...register("first_name", { required: true })}
                  className={cn(
                    "rounded-full sm:h-12 h-10 border border-gray-500 w-full",
                    errors.first_name ? "border-red-500" : ""
                  )}
                  placeholder={`${t("first_name")} *`}
                />
                <Input
                  {...register("middle_name", { required: false })}
                  className={cn(
                    "rounded-full sm:h-12 h-10 border border-gray-500 w-full",
                    errors.middle_name ? "border-red-500" : ""
                  )}
                  placeholder={`${t("middle_name")}`}
                />
                <Input
                  {...register("last_name", { required: true })}
                  className={cn(
                    "rounded-full sm:h-12 h-10 border border-gray-500 w-full",
                    errors.last_name ? "border-red-500" : ""
                  )}
                  placeholder={`${t("last_name")} *`}
                />
              </div>
              <div className="text-[16px] self-start">{t("gender")}</div>
              <div className="space-y-2">
                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "rounded-full h-[56px] text-lg flex items-center gap-2 transition-all",
                      "hover:bg-primary hover:border-primary hover:text-primary-foreground [&>img]:hover:brightness-0 [&>img]:hover:invert",
                      watch("gender") === "m" &&
                        "bg-primary border-primary text-primary-foreground [&>img]:brightness-0 [&>img]:invert"
                    )}
                    onClick={() => setValue("gender", "m")}
                  >
                    <img src="/icons/male.svg" className="w-5 h-5" />
                    {t("male")}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "rounded-full h-[56px] text-lg flex items-center gap-2 transition-all",
                      "hover:bg-primary hover:border-primary hover:text-primary-foreground [&>img]:hover:brightness-0 [&>img]:hover:invert",
                      watch("gender") === "f" &&
                        "bg-primary border-primary text-primary-foreground [&>img]:brightness-0 [&>img]:invert"
                    )}
                    onClick={() => setValue("gender", "f")}
                  >
                    <img src="/icons/female.svg" className="w-5 h-5" />
                    {t("female")}
                  </Button>
                </div>
                {errors.gender && (
                  <p className="text-sm text-red-500">{t("gender_required")}</p>
                )}
              </div>
              <div className="text-[16px] font-semibold self-start">
                {t("contact_information")}
              </div>
              <Input
                {...register("email")}
                type="email"
                className="rounded-full sm:h-12 h-10 border border-gray-500 w-full"
                placeholder={t("email")}
              />
              <PhoneInput
                international
                countryCallingCodeEditable={false}
                defaultCountry="IN"
                value={watch("phone_no")}
                onChange={(value) => {
                  setValue("phone_no", value);
                }}
                maxLength={15}
                limitMaxLength
                placeholder={t("phone_number")}
                className={cn(
                  "border bg-background border-gray-500 rounded-r-full rounded-l-full h-10 px-4",
                  errors.phone_no ? "border-red-500" : ""
                )}
              />
              {errors.phone_no && (
                <p className="text-sm text-red-500">
                  {errors.phone_no.message}
                </p>
              )}
            </div>
          </div>
        </form>
      </>
    );
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose} modal={true}>
        <DialogContent
          className={`max-w-[90%] w-[500px] max-h-[90%] p-0 overflow-y-auto no_scrollbar rounded-2xl sm:rounded-2xl ${
            step === 1 ? "bg-background" : "bg-background"
          } dark:bg-background border-[1.5] shadow-2xl`}
        >
          {step === 1 ? (
            <div className="p-6 space-y-8">
              <div className="space-y-4">
                <div>
                  <h3 className="text-[32px] font-bold mb-1">
                    {t("godfather_for_whom")}
                  </h3>
                  <p className="text-sm">{t("godfather_for_whom_desc")}</p>
                </div>
                <div className="flex gap-4">
                  <Button
                    variant="outline"
                    className={cn(
                      buttonStyles,
                      selectedFor === "myself"
                        ? selectedStyles
                        : unselectedStyles
                    )}
                    onClick={() => setSelectedFor("myself")}
                    disabled={myGodfather}
                  >
                    <img src="/icons/user.svg" className="w-5 h-5" />
                    {t("myself")}
                  </Button>

                  <Button
                    variant="outline"
                    className={cn(
                      buttonStyles,
                      selectedFor === "children"
                        ? selectedStyles
                        : unselectedStyles,
                      !hasPartner && "opacity-50 cursor-not-allowed"
                    )}
                    onClick={() => setSelectedFor("children")}
                    disabled={!hasPartner || childrenGodfather || !hasChildren}
                  >
                    <img src="/icons/children.svg" className="w-7 h-7" />
                    {t("children")}
                  </Button>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <h3 className="text-[32px] font-bold mb-1">
                    {t("select_godfather_from")}
                  </h3>
                  <p className="text-sm">{t("select_godfather_from_desc")}</p>
                </div>
                <div className="flex gap-4">
                  <Button
                    variant="outline"
                    className={cn(
                      buttonStyles,
                      selectedFrom === "family"
                        ? selectedStyles
                        : unselectedStyles
                    )}
                    onClick={() => setSelectedFrom("family")}
                  >
                    <img src="/icons/hierarchy.svg" className="w-6 h-6" />
                    {t("family_tree")}
                  </Button>

                  <Button
                    variant="outline"
                    className={cn(
                      buttonStyles,
                      selectedFrom === "other"
                        ? selectedStyles
                        : unselectedStyles
                    )}
                    onClick={() => setSelectedFrom("other")}
                  >
                    <img src="/icons/user.svg" className="w-5 h-5" />
                    {t("other")}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            renderSecondStep()
          )}
          <div className="p-6">
            <Button
              className="w-full rounded-full h-[56px]"
              disabled={
                isCreating ||
                (step === 1
                  ? !selectedFor || !selectedFrom
                  : selectedFrom === "family"
                  ? !selectedMember
                  : false)
              }
              onClick={step === 1 ? handleContinue : handleSubmit(onSubmit)}
            >
              {isCreating ? (
                <div className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  {t("saving")}
                </div>
              ) : step === 1 ? (
                t("continue")
              ) : (
                t("save")
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmGodfatherDialog
        open={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        onConfirm={handleConfirm}
        isLoading={isCreating}
        memberName={
          selectedFrom === "family"
            ? `${capitalizeName(selectedMember?.first_name)} ${capitalizeName(
                selectedMember?.last_name
              )}`
            : `${watch("first_name")} ${watch("last_name")}`
        }
      />

      <SuccessGodfatherDialog
        open={showSuccess}
        onClose={() => {
          setShowSuccess(false);
          onClose();
        }}
        memberName={
          selectedFrom === "family"
            ? `${capitalizeName(selectedMember?.first_name)} ${capitalizeName(
                selectedMember?.last_name
              )}`
            : `${watch("first_name")} ${watch("last_name")}`
        }
      />
    </>
  );
}
