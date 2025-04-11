import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "./ui/button";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

export default function SuccessGodfatherDialog({ open, onClose, memberName }) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleGoToFamilyTree = () => {
    onClose();
    navigate("/familytree");
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[90%] w-[340px] p-6 rounded-3xl sm:rounded-3xl">
        <DialogHeader className="text-center flex flex-col items-center">
          <DialogTitle className="text-xl text-[26px] font-bold text-primary">
            {t("amazing")}!
          </DialogTitle>
          <DialogDescription className="text-sm text-center max-w-[220px] text-foreground">
            {t("godfather_added_success_message")}
          </DialogDescription>
        </DialogHeader>
        <div className="p-5 bg-[#EEE2F0] rounded-3xl space-y-6">
          <div className="flex justify-center items-center gap-1 font-semibold text-sm text-center">
            {t("you_have_got")}{" "}
            <img src="/kincoinsImg/kintree_coin.svg" className="w-4 h-4" /> 50{" "}
            {t("kincoins")}!
          </div>
          <div className="text-lg text-center font-bold">
            {memberName} {t("is_added_as_godfather")}
          </div>
        </div>
        <Button
          className="w-full rounded-full h-[56px]"
          onClick={handleGoToFamilyTree}
        >
          {t("go_to_family_tree")}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
