import { NavLink, useNavigate, useParams } from "react-router";
import { Button } from "@/components/ui/button";
import { format, isAfter, parse } from "date-fns";
import { useDeleteEvent, useEvent } from "@/hooks/useEvents";
import ComponentLoading from "@/components/component-loading";
import { Map } from "@/components/map";
import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useAuth } from "@/context/AuthProvider";
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
import { Card } from "@/components/ui/card";
import { useTranslation } from "react-i18next";
import { capitalizeName } from "@/utils/stringFormat";
import { decryptId } from "@/utils/encryption";

function ImagesDialog({ images, isOpen, onClose, initialIndex = 0 }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[90vw] w-[700px] max-h-[90vh] h-[450px] p-0">
        <div className="relative">
          <div className="flex justify-center items-center h-full">
            <img
              src={images[currentIndex]?.url}
              className="max-w-[650px] max-h-[400px] object-contain"
              alt="attachment preview"
            />
          </div>
          {images.length > 1 && (
            <>
              <button
                onClick={handlePrevious}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <button
                onClick={handleNext}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function ViewEvent() {
  const { eventId: encryptedId } = useParams();
  const eventId = decryptId(encryptedId);
  const { data: event, isLoading } = useEvent(eventId);
  const [isImagesDialogOpen, setIsImagesDialogOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const { user } = useAuth();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const navigate = useNavigate();
  const { mutate: deleteEvent, isLoading: isDeleting } = useDeleteEvent();
  const { t } = useTranslation();

  const handleDelete = () => {
    deleteEvent(
      { eventId },
      {
        onSuccess: () => {
          navigate("/events");
        },
      }
    );
  };

  const isEventEnded = (endAt) => {
    if (!endAt) return false;
    return isAfter(new Date(), new Date(endAt));
  };

  const canManageEvent = () => {
    return (
      event?.author_details?.id === user?.id && // User is the author
      !isEventEnded(event?.end_at) // Event hasn't ended
    );
  };

  const getEventStatus = (startAt, endAt) => {
    if (!startAt || !endAt)
      return { text: t("unknown"), className: "bg-gray-100 text-gray-600" };

    const startDate = new Date(startAt);
    const endDate = new Date(endAt);
    const currentDate = new Date();

    if (isAfter(currentDate, endDate)) {
      return { text: t("event_ended"), className: "bg-red-100 text-red-600" };
    } else if (isAfter(currentDate, startDate)) {
      return {
        text: t("event_ongoing"),
        className: "bg-green-100 text-green-600",
      };
    } else {
      return {
        text: t("upcoming_event"),
        className: "bg-yellow-100 text-yellow-600",
      };
    }
  };
  if (isLoading) return <ComponentLoading />;
  return (
    <Card className="bg-background rounded-2xl h-full overflow-y-scroll no_scrollbar">
      <div className="overflow-y-scroll no_scrollbar">
        <div className="w-full h-[131px] md:h-[160px] lg:h-[238px] relative">
          <img
            src={
              event?.category?.image_url || "/illustrations/illustration_bg.png"
            }
            className="w-full h-full rounded-lg object-cover"
          />
          <NavLink
            to="/events"
            className="flex items-center absolute top-4 left-4 bg-sky-50 hover:bg-brandPrimary rounded-full p-2 text-brandPrimary hover:text-white"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
          </NavLink>
        </div>
        <div className="max-w-[751px] w-[90%] mx-auto bg-brandSecondary grid grid-cols-12 rounded-lg p-8 -translate-y-12 md:-translate-y-16">
          <div className="col-span-12 md:col-span-7 border-b md:border-b-0 md:border-r border-dashed border-[#475569] pb-5">
            <div className="flex items-center gap-2">
              <Button className="rounded-full bg-brandPrimary py-2 text-white cursor-text hover:bg-brandPrimary/10">
                {capitalizeName(event?.category?.name) || "--"}
              </Button>
              <Button
                className={`rounded-full py-2 cursor-text hover:text-white hover:bg-opacity-80 ${
                  getEventStatus(event?.start_at, event?.end_at).className
                }`}
              >
                {getEventStatus(event?.start_at, event?.end_at).text}
              </Button>
            </div>

            <h2 className="text-2xl mb-6 mt-4">{event?.name || "--"}</h2>
            <div className="flex flex-col gap-2 mb-6">
              <p className="text-xs font-medium text-gray-400 flex items-center justify-start gap-2">
                <img
                  src="/icons/blank-calendar.svg"
                  className="h-[14px] w-[14px]"
                />
                {t("date_and_time")}
              </p>
              <p className="text-lg font-medium text-brandPrimary">
                {format(event?.start_at, "MM/dd/yyyy (EEEE)") || "--"}
              </p>
              <p className="text-lg font-medium text-brandPrimary">
                {format(
                  parse(event?.start_at, "yyyy-MM-dd HH:mm:ss", new Date()),
                  "h:mm a"
                )}{" "}
              </p>
            </div>
            <div className="mb-4">
              <p className="text-xs font-medium text-gray-400 flex items-center justify-start gap-1">
                <img
                  src="/icons/navigation-arrow.svg"
                  className="h-[14px] w-[14px]"
                />
                {t("venue")}
              </p>
            </div>
            <p className="text-sm text-[#0D99FF] font-medium">
              {event?.venue || "--"}
            </p>
          </div>
          <div className="col-span-12 md:col-span-5 mx-auto w-[204px] pt-5">
            <div className="mb-4">
              <p className="text-xs font-medium text-[#5E5F60] mb-3">
                {t("organizer")}
              </p>
              <div className="flex items-center gap-2">
                <img
                  src={
                    event?.author_details?.profile_pic_url ||
                    "/icons/username.svg"
                  }
                  alt=""
                  className="w-10 h-10 rounded-full"
                />
                <div className="flex flex-col">
                  <span className="text-sm ml-2 font-medium">
                    {event?.author_details?.first_name || "--"}{" "}
                    {event?.author_details?.last_name || "--"}
                  </span>
                  <span className="text-sm ml-2">
                    {event?.author_details?.relation || "--"}
                  </span>
                </div>
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-[#5E5F60] mb-3">
                {t("attendees")}
              </p>
              <div className="flex flex-col max-h-[164px] gap-2 overflow-y-scroll no_scrollbar">
                {event?.attendees?.map((attendee) => (
                  <div className="flex items-center gap-2" key={attendee.id}>
                    <img
                      src={attendee?.profile_pic_url || "/icons/username.svg"}
                      alt=""
                      className="w-10 h-10 rounded-full"
                    />
                    <div className="flex flex-col">
                      <span className="text-sm ml-2 font-medium line-clamp-1 break-words text-ellipsis">
                        {attendee?.first_name || ""} {attendee?.last_name || ""}
                      </span>
                      <span className="text-sm ml-2">
                        {attendee?.relation || "--"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-12 mx-auto max-w-[751px] w-[90%] -translate-y-10">
          <div className="col-span-12 md:col-span-7 p-5">
            <h3 className="text-lg font-medium mb-3">{t("description")}</h3>
            <div className="text-sm text-[#5E5F60]">{event?.details}</div>
          </div>
          <div className="col-span-12 md:col-span-5 p-5">
            <div className="text-xs font-medium text-[#5E5F60] mb-3">
              {t("attachment")}
            </div>
            <div className="flex flex-wrap gap-2">
              {event?.attachments?.map((attachment, index) => (
                <div
                  className="w-16 h-16 cursor-pointer hover:opacity-80"
                  key={attachment.id}
                  onClick={() => {
                    setSelectedImageIndex(index);
                    setIsImagesDialogOpen(true);
                  }}
                >
                  <img
                    src={attachment.url}
                    className="w-16 h-16 object-cover border rounded-lg"
                    alt="attachment"
                  />
                </div>
              ))}
            </div>
            <ImagesDialog
              images={event?.attachments || []}
              isOpen={isImagesDialogOpen}
              onClose={() => setIsImagesDialogOpen(false)}
              initialIndex={selectedImageIndex}
            />
          </div>
        </div>
        <div className="flex justify-center max-w-[751px] w-[90%] mx-auto h-[400px] mb-8">
          <Map place={event?.venue} className="w-full h-full" />
        </div>
        <div className="flex justify-end max-w-[751px] w-[90%] mx-auto mb-8 gap-4">
          {canManageEvent() && (
            <>
              <Button
                className="rounded-full"
                onClick={() => navigate(`/edit-event/${eventId}`)}
              >
                {t("edit_event")}
              </Button>
              <Button
                variant="destructive"
                className="rounded-full"
                onClick={() => setShowDeleteDialog(true)}
                disabled={isDeleting}
              >
                {isDeleting ? t("deleting") : t("delete_event")}
              </Button>
            </>
          )}
        </div>
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("are_you_sure")}</AlertDialogTitle>
              <AlertDialogDescription>
                {t("this_action_cannot_be_undone")}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700"
              >
                {t("delete")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Card>
  );
}
