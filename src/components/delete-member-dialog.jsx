import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useDeleteMember } from "@/hooks/useFamily";
import { useTranslation } from "react-i18next";

export function DeleteConfirmationDialog({
  isOpen,
  onClose,
  memberName,
  memberId,
}) {
  const { mutateAsync, isLoading } = useDeleteMember();
  const { t } = useTranslation();
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-[90vw] w-[400px] rounded-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle>{t("are_you_sure")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("delete_member_confirmation")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-full">
            {t("cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={() => mutateAsync(memberId)}
            className="bg-red-600 hover:bg-red-700 rounded-full"
          >
            {isLoading ? t("deleting") : t("delete")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
