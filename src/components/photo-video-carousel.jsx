import { useWindowSize } from "@/hooks/useWindowSize";
import AsyncComponent from "./async-component";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "./ui/carousel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "./ui/dialog";

export default function PhotoVideoCarousel({ attachments, isOpen, onClose }) {
  const { width } = useWindowSize();
  return (
    <AsyncComponent>
      <Dialog
        open={open}
        onOpenChange={onClose}
        modal={true}
        className="bg-transparent"
      >
        <DialogContent className="max-w-[90%] lg:max-w-[700px] max-h-[90%] p-4 lg:p-6">
          <DialogTitle className="hidden"></DialogTitle>
          <DialogDescription className="hidden"></DialogDescription>
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
          >
            <CarouselContent>
              {attachments?.map((attachment) => (
                <CarouselItem
                  key={attachment.id}
                  className="max-h-[500px] w-full"
                >
                  {attachment.type === "video" ? (
                    <video
                      src={attachment.url}
                      className="w-full h-full object-contain"
                      controls
                    />
                  ) : (
                    <img
                      src={attachment.url}
                      alt=""
                      className="w-full h-full object-contain"
                    />
                  )}
                </CarouselItem>
              ))}
            </CarouselContent>
            {width > 768 && attachments?.length > 1 && (
              <>
                <CarouselPrevious className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10" />
                <CarouselNext className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10" />
              </>
            )}
          </Carousel>
        </DialogContent>
      </Dialog>
    </AsyncComponent>
  );
}
