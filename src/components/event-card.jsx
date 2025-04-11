import { encryptId } from "@/utils/encryption";
import { capitalizeName } from "@/utils/stringFormat";
import { format, parse } from "date-fns";
import { NavLink } from "react-router";

export default function EventCard({ event, status }) {
  const encryptedId = encryptId(event?.id);
  if (!encryptedId) {
    console.error("Encryption failed");
    return;
  }
  return (
    <NavLink to={`/events/view-event/${encryptedId}`}>
      <div className="flex flex-col shadow-sm border rounded-2xl bg-background max-h-[300px] cursor-pointer">
        <div className="w-full relative h-[150px] rounded-lg">
          <img
            src={
              event?.category?.image_url || "/illustrations/illustration_bg.png"
            }
            className="w-full h-full rounded-lg object-cover"
          />
          <div className="h-10 absolute bottom-0 bg-black dark:bg-white opacity-90 z-10 w-full text-white dark:text-black text-sm font-medium flex justify-center items-center">
            {format(event?.start_at, "MM/dd/yyyy (EEEE)") || "--"}
          </div>
        </div>
        <div
          className={`w-full flex flex-col gap-2 p-4 ${
            status === "past" && "bg-[#E9E9E9] dark:bg-[#1F2937]"
          } rounded-b-lg`}
        >
          <div className="flex items-center gap-2">
            <img src="/icons/alarm.svg" className="h-[14px] w-[14px]" />
            <span className="text-xs ml-2 font-medium line-clamp-1 text-ellipsis overflow-hidden break-words">
              {format(event?.start_at, "MM/dd/yyyy") || "--"} -{" "}
              {format(
                parse(event?.start_at, "yyyy-MM-dd HH:mm:ss", new Date()),
                "h:mm a"
              )}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <img
              src="/icons/location-compass.svg"
              className="h-[14px] w-[14px]"
            />
            <span className="text-xs ml-2 font-medium line-clamp-1 text-ellipsis overflow-hidden break-words">
              {event?.venue || "--"}
            </span>
          </div>
          <div className="text-lg font-medium line-clamp-1 text-ellipsis overflow-hidden break-words">
            {event?.name || "--"}
          </div>
          <div className="rounded-r-full rounded-l-full bg-brandSecondary py-[6px] px-[12px] text-[10px] font-medium max-w-max">
            {capitalizeName(event?.category?.name) || "--"}
          </div>
        </div>
      </div>
    </NavLink>
  );
}
