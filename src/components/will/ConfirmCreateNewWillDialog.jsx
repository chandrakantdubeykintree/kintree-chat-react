import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "../ui/button";
import { useTranslation } from "react-i18next";

export default function ConfirmCreateNewWillDialog({
  showConfirmDialog,
  setShowConfirmDialog,
  handleConfirmNewWill,
}) {
  const { t } = useTranslation();
  return (
    <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
      <DialogContent className="max-w-[90%] w-[375px] rounded-2xl sm:rounded-2xl">
        <DialogHeader>
          <DialogTitle>{t("create_new_will")}</DialogTitle>
          <DialogDescription>{t("existing_will_warning")}</DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowConfirmDialog(false)}
            className="rounded-full"
          >
            {t("cancel")}
          </Button>
          <Button onClick={handleConfirmNewWill} className="rounded-full">
            {t("create_new")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
