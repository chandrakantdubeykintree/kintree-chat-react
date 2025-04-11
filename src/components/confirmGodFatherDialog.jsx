import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "./ui/button";
import { useTranslation } from "react-i18next";

export default function ConfirmGodfatherDialog({
  open,
  onClose,
  onConfirm,
  memberName,
  isLoading, // Add this prop
}) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[90%] w-[356px] py-6 px-4 sm:rounded-3xl rounded-3xl">
        <DialogHeader className="text-center mb-6">
          <DialogTitle className="text-xl text-center">
            {t("confirm_add_godfather", { name: memberName })}
          </DialogTitle>
        </DialogHeader>
        <div className="flex gap-4">
          <Button
            variant="outline"
            className="flex-1 rounded-full h-[56px] border-black"
            onClick={onClose}
            disabled={isLoading}
          >
            {t("cancel")}
          </Button>
          <Button
            className="flex-1 rounded-full h-[56px]"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                {t("saving")}
              </div>
            ) : (
              t("yes")
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
