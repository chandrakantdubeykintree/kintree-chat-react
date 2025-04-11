import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ICON_LANGUAGES } from "@/constants/iconUrls";
import { useThemeLanguage } from "@/context/ThemeLanguageProvider";
import { LANGUAGE_METADATA, LANGUAGES } from "@/constants/languages";
import { useTranslation } from "react-i18next";
import { useProfile } from "@/hooks/useProfile";

export default function LanguagesDropDown() {
  const { t } = useTranslation();
  const { setLanguage } = useThemeLanguage();
  const { profile: configurations } = useProfile("user/configurations");

  const handleLanguageChange = (languageCode) => {
    setLanguage(languageCode);
  };

  const languagesList = Object.entries(LANGUAGES)?.map(([code, nativeName]) => (
    <DropdownMenuItem
      key={code}
      className="cursor-pointer"
      onClick={() => handleLanguageChange(code)}
    >
      <div className="flex flex-col w-full">
        <div className="flex justify-between items-center">
          <div className="flex flex-col">
            <span className="font-medium">{nativeName}</span>
            <span className="text-xs text-muted-foreground">
              {LANGUAGE_METADATA[code].name}
            </span>
          </div>
          {configurations?.language === code && <span className="ml-2">✓</span>}
        </div>
      </div>
    </DropdownMenuItem>
  ));

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="flex items-center gap-1 md:gap-2">
          <span className="text-sm">
            {LANGUAGES[configurations?.language] || ""}
          </span>
          <img
            src={ICON_LANGUAGES}
            className="w-6 h-6 cursor-pointer transform transition-transform duration-300 ease-in-out hover:scale-125"
            alt="Change Language"
          />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" side="bottom">
        <DropdownMenuLabel>{t("select_language")}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-[300px] overflow-y-scroll no_scrollbar">
          <DropdownMenuGroup>{languagesList}</DropdownMenuGroup>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
