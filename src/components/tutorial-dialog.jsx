import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useWindowSize } from "@/hooks/useWindowSize";
import { useTranslation } from "react-i18next";

export default function TutorialVideoDialog({ isOpen, onClose }) {
  const { t } = useTranslation();
  const { width } = useWindowSize();

  return (
    <Dialog open={isOpen} onOpenChange={onClose} modal={true}>
      <DialogContent className="max-w-[90%] w-screen h-[90%] md:max-w-[90%] md:w-[900px] md:h-auto md:max-h-[90%] p-0 overflow-hidden rounded-2xl md:rounded-2xl">
        <DialogHeader className="p-4 bg-background">
          <DialogTitle>{t("how_to_add_family_member")}</DialogTitle>
        </DialogHeader>
        <div className="relative w-full h-[calc(100%-64px)] md:h-auto md:aspect-video bg-black flex items-center justify-center">
          <video
            className="w-full h-full object-contain"
            controls
            autoPlay
            playsInline
            src={
              width > 768
                ? "https://kintree.com/web-add-member.mp4"
                : "https://kintree.com/mobile-web-add-member.mp4"
            }
          >
            {t("your_browser_does_not_support_the_video_tag")}
          </video>
        </div>
      </DialogContent>
    </Dialog>
  );
}
