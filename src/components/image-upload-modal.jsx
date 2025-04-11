import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { useState } from "react";
import { useProfile } from "@/hooks/useProfile";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

const ALLOWED_FILE_TYPES = ["image/jpeg", "image/jpg", "image/png"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export default function ImageUploadModal({ isOpen, onClose, type }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [validationError, setValidationError] = useState(null);
  const { t } = useTranslation();

  const { updateImage, isUpdating, updateError } = useProfile("user");

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    setValidationError(null);

    if (!file) return;

    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      // setValidationError("Please select a file of type: jpg, jpeg, or png");
      setValidationError(t("please_select_file_type") + "jpg, jpeg, or png");
      return;
    }

    // Validate file size (5MB)
    if (file.size > MAX_FILE_SIZE) {
      setValidationError(t("image_size_less_than_5mb"));
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = () => {
    if (!selectedFile) return;

    const formData = new FormData();
    if (type === "cover") {
      formData.append("cover_image", selectedFile);
    } else {
      formData.append("profile_image", selectedFile);
    }

    const url =
      type === "cover"
        ? "/user/change-cover-image"
        : "/user/change-profile-image";

    updateImage(
      { url, data: formData },
      {
        onSuccess: () => {
          handleClose();
        },
      }
    );
  };

  const handleClose = () => {
    setSelectedFile(null);
    setPreview(null);
    setValidationError(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md w-[90%] rounded-2xl">
        <DialogHeader>
          <DialogTitle>
            {t(
              type === "cover" ? "upload_cover_image" : "upload_profile_image"
            )}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex flex-col items-center gap-4">
            {/* Preview Section */}
            {preview ? (
              <div
                className={`relative ${
                  type === "cover" ? "w-full h-48" : "w-32 h-32 rounded-full"
                }`}
              >
                <img
                  src={preview}
                  alt="Preview"
                  className={`object-cover w-full h-full ${
                    type === "cover" ? "rounded-lg" : "rounded-full"
                  }`}
                />
                {isUpdating && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                    <Loader2 className="w-8 h-8 animate-spin text-white" />
                  </div>
                )}
              </div>
            ) : (
              <div
                className={`bg-gray-100 flex items-center justify-center ${
                  type === "cover"
                    ? "w-full h-48 rounded-lg"
                    : "w-32 h-32 rounded-full"
                }`}
              >
                <p className="text-gray-500 text-center">
                  {" "}
                  {t("no_image_selected")}
                </p>
              </div>
            )}

            {/* Error Messages */}
            {validationError && (
              <p className="text-sm text-red-500 text-center">
                {validationError}
              </p>
            )}
            {updateError && (
              <p className="text-sm text-red-500 text-center">
                {updateError?.response?.data?.message || t("upload_failed")}
              </p>
            )}

            {/* File Selection Button */}
            <label className="cursor-pointer">
              <Button
                variant="outline"
                onClick={() => document.getElementById("file-upload").click()}
                disabled={isUpdating}
                className="rounded-full"
              >
                {t("select_image")}
              </Button>
              <input
                id="file-upload"
                type="file"
                className="hidden"
                accept={ALLOWED_FILE_TYPES.join(",")}
                onChange={handleFileSelect}
                disabled={isUpdating}
              />
            </label>

            <p className="text-xs text-gray-500 text-center">
              {t("supported_formats")}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isUpdating}
              className="rounded-full"
            >
              {t("cancel")}
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || isUpdating}
              className="min-w-[80px] rounded-full"
            >
              {isUpdating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                t("upload")
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
