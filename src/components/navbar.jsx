import { NavLink, useNavigate } from "react-router";
import ThemeToggle from "./theme-toggle";
import ProfileDropDown from "./profile-dropdown";
import NotificationDropDown from "./notification-dropdown";
import LanguagesDropDown from "./languages-dropdown";
import { ICON_KINTREELOGO, ICON_KINTREELOGO_DARK } from "../constants/iconUrls";

import { useWindowSize } from "@/hooks/useWindowSize";
import { capitalizeName } from "@/utils/stringFormat";
import { useProfile } from "@/hooks/useProfile";
import AsyncComponent from "./async-component";
import { api_user_profile } from "@/constants/apiEndpoints";
import { useThemeLanguage } from "@/context/ThemeLanguageProvider";
import { route_foreroom } from "@/constants/routeEnpoints";
import { Search } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { useState, useEffect, useRef } from "react";
import { useSearchUser } from "@/hooks/useUser";
import { useInView } from "react-intersection-observer";
import { encryptId } from "@/utils/encryption";
import { useTranslation } from "react-i18next";
import { useDebounce } from "@/hooks/useDebounce";
import { useClickOutside } from "@/hooks/useClickOutside";

export default function Navbar() {
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  const navigate = useNavigate();
  const [recentSearches, setRecentSearches] = useState(() => {
    const saved = localStorage.getItem("recentSearches");
    return saved ? JSON.parse(saved) : [];
  });

  const handleSearchInput = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    if (!showSearch) setShowSearch(true);
  };

  const handleSearch = async (query) => {
    if (!query.trim()) return;

    try {
      // Save to recent searches
      const updatedSearches = [
        query,
        ...recentSearches.filter((item) => item !== query),
      ].slice(0, 5);

      setRecentSearches(updatedSearches);
      localStorage.setItem("recentSearches", JSON.stringify(updatedSearches));
    } catch (error) {
      console.error("Search failed:", error);
    }
  };

  // Get search results based on current query
  const { theme } = useThemeLanguage();
  const { width } = useWindowSize();
  const { profile: user, isProfileLoading } = useProfile(api_user_profile);
  const { t } = useTranslation();

  const {
    data: searchData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isSearchLoading,
  } = useSearchUser(debouncedSearchQuery, 10);

  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0,
    rootMargin: "100px",
  });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleBlur = () => {
    if (!searchQuery) {
      setShowSearch(false);
    }
  };

  const handleResultClick = (userId) => {
    setShowSearch(false);
    const encryptedId = encryptId(userId);
    if (!encryptedId) {
      console.error("Encryption failed");
      return;
    }

    navigate(`/kintree-member/${encryptedId}`);
    setSearchQuery("");
  };
  const renderSearchResults = () => {
    const allUsers = searchData?.pages?.flatMap((page) => page.users) || [];
    const hasUsers = allUsers.length > 0;
    const totalUsers = searchData?.pages?.[0]?.total_record || 0;

    return (
      <div
        ref={searchResultsRef}
        className="space-y-2 p-2 max-h-[60vh] overflow-y-auto no_scrollbar"
      >
        {hasUsers ? (
          <>
            {allUsers.map((user) => (
              <div
                key={user.user_id}
                className="flex items-center gap-3 p-2 hover:bg-accent rounded-lg cursor-pointer"
                onClick={() => handleResultClick(user.user_id)}
              >
                <img
                  src={user.profile_pic_url}
                  alt={user.first_name}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div className="flex-1">
                  <div className="font-medium">
                    {[user.first_name, user.middle_name, user.last_name]
                      .filter(Boolean)
                      .join(" ")}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    @{user.username}
                  </div>
                </div>
              </div>
            ))}

            {/* Load More Button */}
            {hasNextPage && (
              <div
                className="flex justify-center pt-4"
                onClick={(e) => e.stopPropagation()}
              >
                <Button
                  onClick={handleLoadMore}
                  disabled={isFetchingNextPage}
                  size="sm"
                  className="w-full"
                >
                  {isFetchingNextPage ? (
                    <>{t("loading")}...</>
                  ) : (
                    <>{t("load_more")}</>
                  )}
                </Button>
              </div>
            )}

            {/* Results count */}
            <div className="text-xs text-muted-foreground text-center pt-2">
              {t("showing")} {allUsers.length} {t("of")} {totalUsers}{" "}
              {t("results")}
            </div>
          </>
        ) : (
          <div className="text-center text-muted-foreground py-4">
            {isSearchLoading ? t("loading") : t("no_results_found")}
          </div>
        )}
      </div>
    );
  };
  const searchResultsRef = useRef(null);

  const searchRef = useClickOutside((event) => {
    // Check if the click is inside the search results
    if (
      searchResultsRef.current &&
      searchResultsRef.current.contains(event.target)
    ) {
      return; // Don't close if clicking inside search results
    }

    // Check if the click is on the load more button
    if (event.target.closest("button")?.textContent?.includes(t("load_more"))) {
      return; // Don't close if clicking load more button
    }

    setShowSearch(false);
    setSearchQuery("");
  });

  const handleLoadMore = (e) => {
    e.preventDefault();
    e.stopPropagation();
    fetchNextPage();
  };

  return (
    <AsyncComponent isLoading={isProfileLoading}>
      <div className="h-[84px] flex justify-between items-center">
        <NavLink className="ml-2 lg:ml-4" to={route_foreroom}>
          <img
            src={theme === "light" ? ICON_KINTREELOGO : ICON_KINTREELOGO_DARK}
            alt="logo"
            className="w-[60px] h-12 transform transition-transform duration-300 ease-in-out hover:scale-105"
          />
        </NavLink>
        <div className="hidden sm:block max-w-sm px-4 relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("search")}
              className="w-full pl-10 pr-4 h-10 rounded-full"
              value={searchQuery}
              onChange={handleSearchInput}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearch(searchQuery);
                  e.target.blur();
                }
              }}
            />
          </div>

          {/* Search Results */}
          {debouncedSearchQuery && (
            <div className="absolute top-12 left-0 right-0 bg-background border rounded-lg shadow-lg z-[100]">
              {renderSearchResults()}
            </div>
          )}
        </div>
        <div className="sm:hidden">
          {showSearch && (
            <div
              className="fixed inset-0 bg-black/50 z-[98]"
              onClick={() => setShowSearch(false)}
            />
          )}
          {showSearch ? (
            <div className="fixed top-0 left-0 right-0 z-[99] pt-4 px-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t("search")}
                  className="w-full pl-10 pr-4 h-10 rounded-full bg-background"
                  value={searchQuery}
                  onChange={handleSearchInput}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSearch(searchQuery);
                    }
                  }}
                  onBlur={handleBlur}
                  autoFocus
                />
              </div>

              {/* Mobile Search Results */}
              {debouncedSearchQuery.trim() && (
                <div
                  className="mt-2 bg-background border rounded-lg shadow-lg"
                  ref={searchRef}
                >
                  {renderSearchResults()}
                </div>
              )}
            </div>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSearch(true)}
              className="rounded-full p-4 border bg-gray-50 dark:bg-gray-900"
            >
              <Search className="h-5 w-5" />
            </Button>
          )}
        </div>
        <div className="flex items-center gap-3 md:gap-3 lg:gap-4 mr-2 lg:mr-4">
          <LanguagesDropDown />
          <ThemeToggle />
          <NotificationDropDown />
          {width > 768 ? (
            <>
              <div className="line-clamp-1 overflow-hidden max-w-40 md:max-w-full">
                {capitalizeName(user?.basic_info?.first_name) +
                  " " +
                  capitalizeName(user?.basic_info?.last_name) || "username"}
              </div>
            </>
          ) : null}
          <ProfileDropDown />
        </div>
      </div>
    </AsyncComponent>
  );
}
