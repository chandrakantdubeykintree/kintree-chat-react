import { useNavigate, useParams } from "react-router";
import { NavLink } from "react-router";
import AsyncComponent from "@/components/async-component";
import { useAuth } from "@/context/AuthProvider";
import ComponentLoading from "@/components/component-loading";
import PostComments from "@/components/post-comments";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { decryptId } from "@/utils/encryption";
import { useRecipe } from "@/hooks/useRecipes";
import RecipeCard from "@/components/recipe";

export default function ViewRecipeComments() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { recipeId: encryptedId } = useParams();
  const recipeId = decryptId(encryptedId);
  const { data: recipe, isLoading, refetch, error } = useRecipe(recipeId);
  const navigate = useNavigate();
  const handleRecipeUpdate = () => {
    refetch();
  };

  if (isLoading) return <ComponentLoading />;
  if (error) {
    toast.error(t("failed_to_load_post"));
    navigate("/foreroom");
    return null;
  }

  return (
    <AsyncComponent>
      <div className="w-full mx-auto lg:px-0 flex flex-col">
        <div className="flex items-center gap-4 mb-6">
          <NavLink
            to="/foreroom?tab=recipes"
            className="flex items-center gap-2 text-blue-500 hover:text-blue-600 transition-colors"
          >
            <span className="h-8 w-8 rounded-full hover:bg-sky-100 flex items-center justify-center">
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
            </span>
            {t("back_to_foreroom")}
          </NavLink>
        </div>
        <div className="flex flex-col gap-4 h-full">
          <div className="flex-shrink-0">
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              user={user}
              isRecipeCommentPage={true}
              showCommentInput={false}
            />
          </div>
          <div className="flex-1">
            <PostComments
              postId={recipe.id}
              onCommentUpdate={handleRecipeUpdate}
            />
          </div>
        </div>
      </div>
    </AsyncComponent>
  );
}
