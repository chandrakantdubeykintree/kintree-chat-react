import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User } from "lucide-react";
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
import { useQueryClient } from "@tanstack/react-query";
import { kintreeApi } from "@/services/kintreeApi";
import { useTranslation } from "react-i18next";

export default function BeneficiaryCard({
  beneficiary,
  willId,
  showPercentage = true,
}) {
  const { t } = useTranslation();
  const [percentage, setPercentage] = useState(beneficiary.percentage || "0");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const handleDelete = async () => {
    try {
      await kintreeApi.delete(
        `/will/${willId}/beneficiaries/${beneficiary.id}`
      );
      queryClient.invalidateQueries(["beneficiaries", willId]);
    } catch (error) {
      console.error(t("error_deleting_beneficiary"), error);
    }
  };

  const handlePercentageChange = (e) => {
    const value = e.target.value;
    if (value === "" || (Number(value) >= 0 && Number(value) <= 100)) {
      setPercentage(value);
    }
  };

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div className="flex gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-6 h-6 text-primary" />
          </div>
          <div className="max-w-[100%]">
            <h3 className="font-semibold text-wrap break-words max-w-[100%]">
              {beneficiary.name}
            </h3>
            <p className="text-sm text-gray-500 text-wrap break-words max-w-[100%]">
              {beneficiary.relation || "NA"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {showPercentage && (
            <div className="w-24">
              <Input
                type="number"
                value={percentage}
                onChange={handlePercentageChange}
                min="0"
                max="100"
                className="text-right"
                suffix="%"
              />
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            <img src="/icons/delete.svg" className="w-5 h-5 text-primary" />
          </Button>
        </div>
      </div>

      {isDeleteDialogOpen && (
        <AlertDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
        >
          <AlertDialogContent className="max-w-md w-[90%] rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle>{t("delete_beneficiary")}</AlertDialogTitle>
              <AlertDialogDescription>
                {t("remove_beneficiary_warning")}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-full">
                {t("cancel")}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground rounded-full"
              >
                {t("delete")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </Card>
  );
}
