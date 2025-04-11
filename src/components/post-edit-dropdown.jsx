import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ICON_OPTIONS } from "@/constants/iconUrls";

import { postDropDown } from "@/constants/navLinks";
import { route_edit_poll, route_edit_post } from "@/constants/routeEnpoints";
import { useDeletePost } from "@/hooks/usePosts";
import { encryptId } from "@/utils/encryption";
import { useTranslation } from "react-i18next";
import { NavLink } from "react-router";

export default function PostEditDeleteDropDown({ type, id, isviewpost }) {
  const { t } = useTranslation();
  const options = postDropDown?.slice(type === "poll" ? 1 : 0);
  const { mutate: deletePost, isPending } = useDeletePost();
  const handleDelete = () => {
    deletePost({ postId: id, postType: "posts", type: type });
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
        {options?.map(({ label, icon, path }) => (
          <DropdownMenuItem
            className="cursor-pointer"
            key={path}
            disabled={isPending}
          >
            {isviewpost ? (
              <NavLink
                key={path}
                to={
                  path !== "delete"
                    ? type === "normal"
                      ? "/foreroom/" + route_edit_post + "/" + encryptId(id)
                      : "/foreroom/" + route_edit_poll + "/" + encryptId(id)
                    : null
                }
                className="flex gap-4"
                onClick={path === "delete" ? handleDelete : null}
              >
                <img src={icon} className="h-6 w-6" />
                <span className="text-sm">{t(label)}</span>
              </NavLink>
            ) : (
              <NavLink
                key={path}
                to={
                  path !== "delete"
                    ? type === "normal"
                      ? route_edit_post + "/" + encryptId(id)
                      : route_edit_poll + "/" + encryptId(id)
                    : null
                }
                className="flex gap-4"
                onClick={path === "delete" ? handleDelete : null}
              >
                <img src={icon} className="h-6 w-6" />
                <span className="text-sm">{t(label)}</span>
              </NavLink>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
