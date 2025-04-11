import { kintreeApi } from "../services/kintreeApi";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { replaceUrlParams } from "../utils/stringFormat";
import toast from "react-hot-toast";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";

export const QUERY_KEYS = {
  RECIPES: "recipes",
  RECIPE: "recipe",
  RECIPE_REACTIONS: "recipe_reactions",
  RECIPE_COMMENTS: "recipe_comments",
};

const handleApiError = (error) => {
  const message = error.response?.data?.message || "Something went wrong";
  toast.error(message);
  return Promise.reject(error);
};

export const fetchRecipes = async ({
  pageParam = 1,
  limit = 15,
  categoryId,
}) => {
  try {
    const params = { page: pageParam, limit };
    if (categoryId) {
      params.recipe_category_id = categoryId;
    }
    const response = await kintreeApi.get("/recipes", { params });
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

export const fetchRecipeById = async (recipeId) => {
  try {
    const response = await kintreeApi.get(`/recipes/${recipeId}`);
    return response.data.data;
  } catch (error) {
    return handleApiError(error);
  }
};

export const createRecipe = async (newRecipe) => {
  try {
    if (newRecipe.files) {
      const formData = new FormData();
      newRecipe.files.forEach((file) => {
        formData.append("files", file);
      });
      Object.keys(newRecipe).forEach((key) => {
        if (key !== "files") {
          if (typeof newRecipe[key] === "object") {
            formData.append(key, JSON.stringify(newRecipe[key]));
          } else {
            formData.append(key, newRecipe[key]);
          }
        }
      });

      const response = await kintreeApi.post("/recipe", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    }

    const response = await kintreeApi.post("/recipe", newRecipe);
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

export const editRecipe = async (recipeId, updatedRecipe) => {
  try {
    if (updatedRecipe.files) {
      const formData = new FormData();
      updatedRecipe.files.forEach((file) => {
        formData.append("files", file);
      });
      Object.keys(updatedRecipe).forEach((key) => {
        if (key !== "files") {
          if (typeof updatedRecipe[key] === "object") {
            formData.append(key, JSON.stringify(updatedRecipe[key]));
          } else {
            formData.append(key, updatedRecipe[key]);
          }
        }
      });

      const response = await kintreeApi.put(`/recipe/${recipeId}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    }

    const response = await kintreeApi.put(`/recipe/${recipeId}`, updatedRecipe);
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

export const deleteRecipe = async (recipeId) => {
  try {
    const response = await kintreeApi.delete(`/posts/${recipeId}`);
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

// Reaction and Comment Functions
export const handleRecipeReaction = async ({ recipeId, type }) => {
  try {
    const url = replaceUrlParams("/recipe/:recipeId/reactions", { recipeId });
    const response = await kintreeApi.post(url, { type });
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

export const fetchRecipeComments = async ({
  recipeId,
  pageParam = 1,
  limit = 10,
}) => {
  try {
    const url = replaceUrlParams("/recipe/:recipeId/comments", { recipeId });
    const response = await kintreeApi.get(url, {
      params: { page: pageParam, limit },
    });
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

export const createRecipeComment = async ({ recipeId, comment, parent_id }) => {
  try {
    const url = replaceUrlParams("/recipe/:recipeId/comments", { recipeId });
    const payload = parent_id ? { comment, parent_id } : { comment };
    const response = await kintreeApi.post(url, payload);
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

// Hooks
export const useRecipes = (categoryId, limit = 15) => {
  const { t } = useTranslation();
  return useInfiniteQuery({
    queryKey: [QUERY_KEYS.RECIPES, categoryId],
    queryFn: ({ pageParam = 1 }) =>
      fetchRecipes({ pageParam, limit, categoryId }),
    getNextPageParam: (lastPage) => lastPage.data.next_page ?? undefined,
    refetchOnWindowFocus: false,
    refetchInterval: 60000,
    retry: 2,
    onError: (error) => {
      toast.error(t("error_failed_to_fetch_recipes"));
    },
  });
};

export const useRecipe = (recipeId, options = {}) => {
  const { t } = useTranslation();
  return useQuery({
    queryKey: [QUERY_KEYS.RECIPE, recipeId],
    queryFn: () => fetchRecipeById(recipeId),
    enabled: Boolean(recipeId),
    ...options,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    staleTime: 0,
    cacheTime: 0,
    retry: 2,
    onError: (error) => {
      toast.error(t("error_failed_to_fetch_recipe_details"));
    },
  });
};

export const useCreateRecipe = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: async (data) => {
      const response = await kintreeApi.post("/recipes", data, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.RECIPES] });
    },
  });
};

export const useEditRecipe = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: async ({ recipeId, updatedRecipe }) => {
      await kintreeApi.put(`/recipes/${recipeId}`, updatedRecipe, {
        headers: {
          "Content-Type": "application/json",
        },
      });
    },
    onSuccess: (data) => {
      toast.success(t("recipe_updated_successfully"));
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.RECIPES],
        refetchType: "all",
      });
      // queryClient.invalidateQueries({
      //   queryKey: [QUERY_KEYS.RECIPE, data.id],
      //   refetchType: "all",
      // });
    },
    onError: (error) => {
      toast.error(t("error_failed_to_update_recipe"));
    },
  });
};

export const useDeleteRecipe = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: deleteRecipe,
    onSuccess: () => {
      toast.success(t("recipe_deleted_successfully"));
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.RECIPES] });
      navigate("/foreroom");
    },
    onError: (error) => {
      toast.error(t("error_failed_to_delete_recipe"));
    },
  });
};

export const useRecipeComments = (recipeId) => {
  const { t } = useTranslation();
  return useInfiniteQuery({
    queryKey: [QUERY_KEYS.RECIPE_COMMENTS, recipeId],
    queryFn: ({ pageParam = 1 }) =>
      fetchRecipeComments({ recipeId, pageParam, limit: 10 }),
    getNextPageParam: (lastPage) => lastPage?.data?.next_page ?? undefined,
    enabled: Boolean(recipeId),
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60,
    retry: 2,
    onError: (error) => {
      toast.error(t("error_failed_to_fetch_comments"));
    },
  });
};

export const useCreateRecipeComment = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: createRecipeComment,
    onSuccess: (_, { recipeId }) => {
      toast.success(t("comment_added_successfully"));
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.RECIPE_COMMENTS, recipeId],
      });
    },
    onError: (error) => {
      toast.error(t("error_failed_to_add_comment"));
    },
  });
};
