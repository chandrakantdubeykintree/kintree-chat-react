import { ICON_DARKMODE, ICON_LIGHT } from "@/constants/iconUrls";
import { useThemeLanguage } from "@/context/ThemeLanguageProvider";

export default function ThemeToggle() {
  const { theme, setTheme } = useThemeLanguage();

  return (
    <div className="flex items-center space-x-2">
      {theme === "dark" ? (
        <div onClick={() => setTheme("light")}>
          <img
            src={ICON_LIGHT}
            className="h-6 w-6 cursor-pointer transform transition-transform duration-300 ease-in-out hover:scale-125"
          />
        </div>
      ) : (
        <div onClick={() => setTheme("dark")}>
          <img
            src={ICON_DARKMODE}
            className="h-6 w-6 cursor-pointer transform transition-transform duration-300 ease-in-out hover:scale-125"
          />
        </div>
      )}
    </div>
  );
}
