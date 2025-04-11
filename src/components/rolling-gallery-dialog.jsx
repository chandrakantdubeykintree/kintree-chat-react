import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import RollingGallery from "./rolling-gallery";

const RollingGalleryDialog = ({ open, onClose, images = [] }) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] w-[1000px] bg-transparent border-none">
        <DialogHeader>
          <DialogTitle>Family Gallery</DialogTitle>
        </DialogHeader>
        <RollingGallery
          images={images.filter((url) => url)}
          autoplay={true}
          pauseOnHover={true}
        />
      </DialogContent>
    </Dialog>
  );
};

export default RollingGalleryDialog;
