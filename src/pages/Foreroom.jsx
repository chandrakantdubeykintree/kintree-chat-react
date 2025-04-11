import { usePosts } from "@/hooks/usePosts";
import ComponentErrorBoundary from "../errorBoundaries/ComponentErrorBoundary";
import CreatePostCard from "../components/create-post-card";
import { useEffect, useRef, useState } from "react";
import GlobalSpinner from "../components/global-spinner";
import ComponentLoading from "../components/component-loading";
import Posts from "../components/posts";
import { getInitials } from "@/utils/stringFormat";
import { useProfile } from "@/hooks/useProfile";
import { api_user_profile } from "@/constants/apiEndpoints";
import { CustomTabPanel, CustomTabs } from "@/components/ui/custom-tabs";
import { useTranslation } from "react-i18next";
import Recipes from "@/components/recipes";
import { useRecipeCategories } from "@/hooks/useMasters";
import { Card } from "@/components/ui/card";
import EmptyState from "@/components/empty-state";
import { ClipboardList } from "lucide-react";
import { useSearchParams } from "react-router";

export default function Foreroom() {
  const { profile: user } = useProfile(api_user_profile);
  const { t } = useTranslation();
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") || "global_feed";
  const [activeTab, setActiveTab] = useState(initialTab);
  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } =
    usePosts();

  const {
    data: recipeCategories,
    isLoading: recipeCategoriesLoading,
    isError: recipeCategoriesError,
  } = useRecipeCategories();

  const postsData = data?.pages?.flatMap((page) => page?.data?.posts);
  const loaderRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    });

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => {
      if (loaderRef.current) {
        observer.unobserve(loaderRef.current);
      }
    };
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);
  if (isLoading) return <GlobalSpinner />;

  const handleTabChange = (newTab) => {
    setSearchParams({ tab: newTab });
    setActiveTab(newTab);
  };

  return (
    <div className="grid grid-cols-1">
      <CreatePostCard
        user={{
          profile_pic_url: user?.profile_pic_url,
          userInitials:
            getInitials(user?.basic_info?.first_name) +
            " " +
            getInitials(user?.basic_info?.last_name),
        }}
      />
      <Card className="px-6 mt-4">
        <CustomTabs
          tabs={[
            {
              label: t("global_feed"),
              value: "global_feed",
            },
            {
              label: t("recipes"),
              value: "recipes",
            },
          ]}
          activeTab={activeTab}
          onChange={handleTabChange}
          variant="underline"
        />
      </Card>

      {activeTab === "recipes" && (
        <Card className="flex flex-col p-2 mt-4">
          <div className="px-2 text-[18px] font-semibold">Category</div>
          <div className="flex gap-2 overflow-x-auto no_scrollbar px-2">
            <button
              className={`px-4 py-2 rounded-full ${
                !selectedCategory
                  ? "bg-primary text-white"
                  : "bg-gray-100 hover:bg-gray-200"
              }`}
              onClick={() => setSelectedCategory(null)}
            >
              {t("all")}
            </button>
            {recipeCategories?.map((category) => (
              <button
                key={category.id}
                className={`px-4 py-2 rounded-full whitespace-nowrap ${
                  selectedCategory === category.id
                    ? "bg-primary text-white"
                    : "bg-gray-100 hover:bg-gray-200"
                }`}
                onClick={() => setSelectedCategory(category.id)}
              >
                {category.name}
              </button>
            ))}
          </div>
        </Card>
      )}

      <CustomTabPanel value="global_feed" activeTab={activeTab}>
        <ComponentErrorBoundary>
          <div className="w-full mx-auto">
            <div className="w-full mx-auto">
              {postsData?.length > 0 ? (
                <div className="space-y-1 md:space-y-4">
                  {postsData?.map((post) => (
                    <Posts
                      key={post.id}
                      post={post}
                      user={{
                        profile_pic_url: user?.profile_pic_url,
                        userInitials:
                          getInitials(user?.basic_info?.first_name) +
                          " " +
                          getInitials(user?.basic_info?.last_name),
                        id: user?.id,
                      }}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  message={t("no_posts_right_now")}
                  message2={t("come_back_later")}
                  title={t("no_posts")}
                  imgSrc={"/illustrations/no-posts.svg"}
                />
              )}
            </div>

            {hasNextPage && (
              <div
                ref={loaderRef}
                className="h-12 flex justify-center items-center"
              >
                {isFetchingNextPage ? (
                  <ComponentLoading />
                ) : (
                  <span>{t("scroll_to_load_more")}</span>
                )}
              </div>
            )}
          </div>
        </ComponentErrorBoundary>
      </CustomTabPanel>
      <CustomTabPanel value="recipes" activeTab={activeTab}>
        <ComponentErrorBoundary>
          <Recipes
            user={{
              profile_pic_url: user?.profile_pic_url,
              userInitials:
                getInitials(user?.basic_info?.first_name) +
                " " +
                getInitials(user?.basic_info?.last_name),
              id: user?.id,
            }}
            categoryId={selectedCategory}
            showCommentInput={true}
          />
        </ComponentErrorBoundary>
      </CustomTabPanel>
    </div>
  );
}
