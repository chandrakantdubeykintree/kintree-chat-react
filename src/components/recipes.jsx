import { useRecipes } from "@/hooks/useRecipes";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import ComponentLoading from "./component-loading";
import RecipeCard from "./recipe";
import EmptyState from "./empty-state";
import { UtensilsCrossed } from "lucide-react";
import { Card } from "./ui/card";

export default function Recipes({ user, categoryId }) {
  const { t } = useTranslation();
  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useRecipes(categoryId);

  const recipesData = data?.pages?.flatMap((page) => page?.data);
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

  if (isLoading) return <ComponentLoading />;

  return (
    <div className="w-full">
      {recipesData?.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {recipesData?.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} user={user} />
          ))}
        </div>
      ) : (
        <EmptyState
          message={t("no_recipes_right_now")}
          message2={t("come_back_later")}
          title={t("no_recipes")}
          imgSrc={"/illustrations/no-recipes.svg"}
        />
      )}

      {hasNextPage && (
        <div
          ref={loaderRef}
          className="h-12 flex justify-center items-center p-8 py-16"
        >
          {isFetchingNextPage ? (
            <ComponentLoading />
          ) : (
            <span>{t("scroll_to_load_more")}</span>
          )}
        </div>
      )}
    </div>
  );
}
