import { FEELINGSDROPDOWN } from "@/constants/dropDownConstants";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { X } from "lucide-react";
import { capitalizeName } from "@/utils/stringFormat";
import { useTranslation } from "react-i18next";

export default function FeelingsDropDown({
  selectedFeeling,
  setSelectedFeeling,
}) {
  const { t } = useTranslation();

  return (
    <div className="relative">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          {selectedFeeling ? (
            <Button
              variant="outline"
              className="flex gap-2 items-center rounded-full"
            >
              <div className="w-4 h-4 flex items-center justify-center">
                <img
                  src={
                    FEELINGSDROPDOWN?.find(
                      (item) => item.id === selectedFeeling
                    ).image_url
                  }
                  alt={t(
                    FEELINGSDROPDOWN?.find(
                      (item) => item.id === selectedFeeling
                    ).name
                  )}
                  className="transform transition-transform duration-300 ease-in-out hover:scale-125"
                />
              </div>
              <span>
                {capitalizeName(
                  t(
                    FEELINGSDROPDOWN?.find(
                      (item) => item.id === selectedFeeling
                    ).name
                  )
                )}
              </span>
            </Button>
          ) : (
            <Button variant="outline" className="rounded-full">
              {t("add_feelings")}
            </Button>
          )}
        </DropdownMenuTrigger>
        {selectedFeeling && (
          <X
            className="h-4 w-4 text-gray-500 hover:text-gray-700 absolute -right-6 top-1/2 -translate-y-1/2 cursor-pointer"
            onClick={() => setSelectedFeeling(null)}
          />
        )}

        <DropdownMenuContent className="max-h-72 px-4 w-52 overflow-scroll no_scrollbar border rounded-lg py-4 p-5 flex flex-col gap-4 mt-2">
          <DropdownMenuLabel className="font-semibold text-sm py-2">
            {t("how_are_you_feeling")}
          </DropdownMenuLabel>
          <ul className="flex flex-col gap-4">
            {FEELINGSDROPDOWN.map((item) => (
              <DropdownMenuItem
                key={item.id}
                onClick={() => setSelectedFeeling(item)}
                className={`rounded-lg cursor-pointer px-3 py-2 ${
                  selectedFeeling === item.id
                    ? "bg-light-cta text-dark-text"
                    : "text-light-text"
                } `}
              >
                <a className="flex gap-4">
                  <div className="w-5 h-5 flex items-center justify-center">
                    <img src={item.image_url} alt={item.name} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold">
                      {capitalizeName(t(item.name))}
                    </h3>
                    {/* <p className="text-xs">{item.desc}</p> */}
                  </div>
                </a>
              </DropdownMenuItem>
            ))}
          </ul>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
