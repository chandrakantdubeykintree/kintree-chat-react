import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ICON_OPTIONS } from "@/constants/iconUrls";
import { recipeDropDown } from "@/constants/navLinks";
import { route_edit_recipe } from "@/constants/routeEnpoints";
import { useDeleteRecipe } from "@/hooks/useRecipes";
import { encryptId } from "@/utils/encryption";
import { useTranslation } from "react-i18next";
import { NavLink } from "react-router";

export default function RecipeEditDeleteDropDown({ id, recipeId }) {
  const { t } = useTranslation();
  const { mutate: deleteRecipe, isPending } = useDeleteRecipe();
  const handleDelete = () => {
    deleteRecipe(id);
  };
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <img
          src={ICON_OPTIONS}
          className="w-4 h-4 cursor-pointer transform transition-transform duration-300 ease-in-out hover:scale-125"
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-36 rounded-2xl">
        {recipeDropDown?.map(({ label, icon, path }) => (
          <DropdownMenuItem
            className="cursor-pointer"
            key={path}
            disabled={isPending}
          >
            <NavLink
              key={path}
              to={
                path !== "delete"
                  ? route_edit_recipe + "/" + encryptId(recipeId)
                  : null
              }
              className="flex gap-4"
              onClick={path === "delete" ? handleDelete : null}
            >
              <img src={icon} className="h-6 w-6" />
              <span className="text-sm">{t(label)}</span>
            </NavLink>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
