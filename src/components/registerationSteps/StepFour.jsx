import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { profileImage } from "@/constants/presetAvatars";
import { useTranslation } from "react-i18next";

export function StepFour({
  register,
  errors,
  setValue,
  watch,
  gender,
  handleSubmit,
}) {
  const { t } = useTranslation();
  const [selectedPresetId, setSelectedPresetId] = useState(null);
  const watchedImage = watch("profile_image");
  const watchedPresetId = watch("preseted_profile_image_id");

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setValue("profile_image", file);
      setSelectedPresetId(null);
      setValue("preseted_profile_image_id", null);
    }
  };

  const handlePresetSelect = (id) => {
    if (selectedPresetId === id) {
      setSelectedPresetId(null);
      setValue("preseted_profile_image_id", null);
    } else {
      setSelectedPresetId(id);
      setValue("preseted_profile_image_id", id);
      setValue("profile_image", null);
    }
  };

  const handleSkip = () => {
    setValue("skipped", 1);
    setValue("profile_image", null);
    setValue("preseted_profile_image_id", null);
    handleSubmit();
  };

  // Get the current avatar URL based on selection type
  const getCurrentAvatarUrl = () => {
    if (watchedImage) {
      return URL.createObjectURL(watchedImage);
    }
    if (watchedPresetId) {
      const selectedPreset = profileImage("m").find(
        (avatar) => avatar.id === watchedPresetId
      );
      return selectedPreset?.url;
    }
    return undefined;
  };

  const clearSelection = () => {
    setValue("profile_image", null);
    setValue("preseted_profile_image_id", null);
    setSelectedPresetId(null);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-4">
        <input
          type="file"
          id="profile_image"
          accept="image/*"
          className="hidden"
          onChange={handleImageUpload}
        />
        <label
          htmlFor="profile_image"
          className="cursor-pointer flex flex-col items-center gap-2"
        >
          <Avatar className="h-24 w-24 relative group border">
            <AvatarImage src={getCurrentAvatarUrl()} alt="Profile" />
            <AvatarFallback>{t("upload")}</AvatarFallback>
            {(watchedImage || watchedPresetId) && (
              <div
                className="absolute inset-0 bg-black/60 hidden group-hover:flex items-center justify-center rounded-full cursor-pointer"
                onClick={(e) => {
                  e.preventDefault();
                  clearSelection();
                }}
              >
                <span className="text-white text-sm">{t("clear")}</span>
              </div>
            )}
          </Avatar>
          <span className="text-sm text-muted-foreground">
            {t("upload_profile_picture_or_select_avatar")}
          </span>
        </label>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {profileImage(gender?.toLowerCase() || "m").map((avatar) => (
          <Button
            key={avatar.id}
            type="button"
            variant="outline"
            className={cn(
              "rounded-full",
              "p-0 h-auto aspect-square",
              selectedPresetId === avatar.id && "ring-2 ring-brandPrimary"
            )}
            onClick={() => handlePresetSelect(avatar.id)}
          >
            <img
              src={avatar.url}
              alt={`Avatar ${avatar.id}`}
              className="w-full h-full object-cover rounded-full"
            />
          </Button>
        ))}
      </div>

      <Button
        type="button"
        variant="ghost"
        onClick={handleSkip}
        className="text-muted-foreground"
      >
        {t("skip_for_now")}
      </Button>

      {errors.profile_image && (
        <span className="text-sm text-red-500 text-center">
          {errors.profile_image.message}
        </span>
      )}
    </div>
  );
}
