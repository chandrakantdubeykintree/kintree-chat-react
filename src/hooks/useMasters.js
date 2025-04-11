import { kintreeApi } from "@/services/kintreeApi";
import { useQuery } from "@tanstack/react-query";
import { useTransition } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

export const QUERY_KEYS = {
  FEELINGS: "feelings",
  EVENT_CATEGORIES: "eventCategories",
  PRESET_PROFILE_IMAGES: "presetProfileImages",
  RELIGIONS: "religions",
  RELIGIONS_ALL_IN_ONE: "religionsAllInOne",
  CASTES: "castes",
  GOTRAS: "gotras",
  SECTS: "sects",
  RELATIONSHIP_TYPES: "relationshipTypes",
  OCCUPATIONS: "occupations",
  REACTION_TYPES: "reactionTypes",
  BLOOD_GROUPS: "bloodGroups",
  EDUCATION_TYPES: "educationTypes",
  INTERESTS: "interests",
  COUNTRIES: "countries",
  LANGUAGES: "languages",
  AGE_RANGES: "ageRanges",
  KINCOIN_REWARD_EVENTS: "kincoin-reward-events",
  PRODUCTS: "products",
  SUB_CASTES: "subCastes",
  MERGE_RELATION_TYPES: "mergeRelationTypes",
  RECIPE_CATEGORY: "recipeCategory",
};

const handleApiError = (error) => {
  const message = error.response?.data?.message || "Something went wrong";
  toast.error(message);
  return Promise.reject(error);
};

export const fetchProducts = async () => {
  const myHeaders = new Headers();
  myHeaders.append(
    "Authorization",
    "Basic Y2tfOTdkNTgzMzFmNzkwNjgwOTI5ZTU1NTA1YjRkOGUyN2Y3MDA3NWVlNDpjc180Yjk0MDAyNWYwNDllZjYxYWI4YzliYTU3MWJlOTUzNzQzYTZhMzBj",
  );

  const requestOptions = {
    method: "GET",
    headers: myHeaders,
    redirect: "follow",
  };

  const response = await fetch(
    "https://web.kintree.info/wp-json/wc/v3/products",
    requestOptions,
  );

  const data = await response.json();

  if (!response.ok) {
    return handleApiError({ response: { data: data } });
  }

  return data;
};

export const getRecipeCategories = async () => {
  const response = await kintreeApi.get("/recipe-categories");
  if (!response.data.success) return handleApiError(response);
  return response.data.data;
};

export const getMergeRelationTypes = async () => {
  const response = await kintreeApi.get("/relation-types");
  if (!response.data.success) return handleApiError(response);
  return response.data.data;
};

export const fetchFeelings = async () => {
  const response = await kintreeApi.get("/feelings");
  if (!response.data.success) return handleApiError(response);
  return response.data.data;
};

export const fetchEventCategories = async () => {
  const response = await kintreeApi.get("/event-categories");
  if (!response.data.success) return handleApiError(response);
  return response.data.data;
};

export const fetchPresetProfileImages = async (gender) => {
  const response = await kintreeApi.get("/preset-profile-images", {
    params: { gender },
  });
  if (!response.data.success) return handleApiError(response);
  return response.data.data;
};

export const fetchReligions = async () => {
  const response = await kintreeApi.get("/religions");
  if (!response.data.success) return handleApiError(response);
  return response.data.data;
};

export const fetchReligionsAllInOne = async () => {
  const response = await kintreeApi.get("/religions-all-in-one");
  if (!response.data.success) return handleApiError(response);
  return response.data.data;
};

export const fetchCastes = async (religionId) => {
  const response = await kintreeApi.get(`/religions/${religionId}/castes`);
  if (!response.data.success) return handleApiError(response);
  return response.data.data;
};

export const fetchGotras = async (religionId) => {
  const response = await kintreeApi.get(`/religions/${religionId}/gotras`);
  if (!response.data.success) return handleApiError(response);
  return response.data.data;
};

export const fetchSects = async (religionId) => {
  const response = await kintreeApi.get(`/religions/${religionId}/sects`);
  if (!response.data.success) return handleApiError(response);
  return response.data.data;
};

export const fetchRelationshipTypes = async () => {
  const response = await kintreeApi.get("/relationship-types");
  if (!response.data.success) return handleApiError(response);
  return response.data.data;
};

export const fetchOccupations = async () => {
  const response = await kintreeApi.get("/occupations");

  if (!response.data.success) return handleApiError(response);
  return response.data.data;
};

export const fetchReactionTypes = async () => {
  const response = await kintreeApi.get("/reaction-types");
  if (!response.data.success) return handleApiError(response);
  return response.data.data;
};

export const fetchBloodGroups = async () => {
  const response = await kintreeApi.get("/blood-groups");
  if (!response.data.success) return handleApiError(response);
  return response.data.data;
};

export const fetchEducationTypes = async () => {
  const response = await kintreeApi.get("/education-types");
  if (!response.data.success) return handleApiError(response);
  return response.data.data;
};

export const fetchInterests = async () => {
  const response = await kintreeApi.get("/interests");
  if (!response.data.success) return handleApiError(response);
  return response.data.data;
};

export const fetchCountries = async () => {
  const response = await kintreeApi.get("/countries");
  if (!response.data.success) return handleApiError(response);
  return response.data.data;
};

export const fetchLanguages = async () => {
  const response = await kintreeApi.get("/languages");
  if (!response.data.success) return handleApiError(response);
  return response.data.data;
};

export const fetchAgeRanges = async () => {
  const response = await kintreeApi.get("/age-ranges");
  if (!response.data.success) return handleApiError(response);
  return response.data.data;
};

export const fetchKincoinRewardEvents = async () => {
  const response = await kintreeApi.get("/kin-coin-reward-events");
  if (!response.data.success) return handleApiError(response);
  return response.data.data;
};

export const fetchSubCastes = async (religionId, casteId) => {
  const response = await kintreeApi.get(`/religions/${religionId}/castes`, {
    params: { caste_id: casteId },
  });
  if (!response.data.success) return handleApiError(response);
  return response.data.data;
};

export const useFetchProducts = () => {
  const { t } = useTranslation();

  return useQuery({
    queryKey: [QUERY_KEYS.PRODUCTS],
    queryFn: fetchProducts,
    refetchOnWindowFocus: false,
    retry: 2,
    onError: (error) => {
      toast.error(t("failed_fetch_products"));
    },
  });
};

export const useRecipeCategories = () => {
  const { t } = useTransition();
  return useQuery({
    queryKey: [QUERY_KEYS.RECIPE_CATEGORY],
    queryFn: getRecipeCategories,
    refetchOnWindowFocus: false,
    retry: 2,
    onError: (error) => {
      toast.error(t("failed_fetch_recipe_category"));
    },
  });
};

export const useFeelings = () => {
  const { t } = useTranslation();

  return useQuery({
    queryKey: [QUERY_KEYS.FEELINGS],
    queryFn: fetchFeelings,
    refetchOnWindowFocus: false,
    retry: 2,
    onError: (error) => {
      toast.error(t("failed_fetch_feelings"));
    },
  });
};

export const useMergeRelationTypes = () => {
  const { t } = useTranslation();

  return useQuery({
    queryKey: [QUERY_KEYS.MERGE_RELATION_TYPES],
    queryFn: getMergeRelationTypes,
    refetchOnWindowFocus: false,
    retry: 2,
    onError: (error) => {
      toast.error(t("failed_fetch_religions"));
    },
  });
};

export const useEventCategories = () => {
  const { t } = useTranslation();
  return useQuery({
    queryKey: [QUERY_KEYS.EVENT_CATEGORIES],
    queryFn: fetchEventCategories,
    refetchOnWindowFocus: false,
    retry: 2,
    onError: (error) => {
      toast.error(t("failed_fetch_event_categories"));
    },
  });
};

export const usePresetProfileImages = (gender) => {
  const { t } = useTranslation();
  return useQuery({
    queryKey: [QUERY_KEYS.PRESET_PROFILE_IMAGES, gender],
    queryFn: () => fetchPresetProfileImages(gender),
    enabled: Boolean(gender),
    refetchOnWindowFocus: false,
    retry: 2,
    onError: (error) => {
      toast.error(t("failed_fetch_profile_images"));
    },
  });
};

export const useReligions = () => {
  const { t } = useTranslation();
  return useQuery({
    queryKey: [QUERY_KEYS.RELIGIONS],
    queryFn: fetchReligions,
    refetchOnWindowFocus: false,
    retry: 2,
    onError: (error) => {
      toast.error(t("failed_fetch_religions"));
    },
  });
};

export const useReligionsAllInOne = () => {
  const { t } = useTranslation();
  return useQuery({
    queryKey: [QUERY_KEYS.RELIGIONS_ALL_IN_ONE],
    queryFn: fetchReligionsAllInOne,
    refetchOnWindowFocus: false,
    retry: 2,
    onError: (error) => {
      toast.error(t("failed_fetch_religions_data"));
    },
  });
};

export const useCastes = (religionId) => {
  const { t } = useTranslation();
  return useQuery({
    queryKey: [QUERY_KEYS.CASTES, religionId],
    queryFn: () => fetchCastes(religionId),
    enabled: Boolean(religionId),
    refetchOnWindowFocus: false,
    retry: 2,
    onError: (error) => {
      toast.error(t("failed_fetch_castes"));
    },
  });
};

export const useGotras = (religionId) => {
  const { t } = useTranslation();
  return useQuery({
    queryKey: [QUERY_KEYS.GOTRAS, religionId],
    queryFn: () => fetchGotras(religionId),
    enabled: Boolean(religionId),
    refetchOnWindowFocus: false,
    retry: 2,
    onError: (error) => {
      toast.error(t("failed_fetch_gotras"));
    },
  });
};

export const useSects = (religionId) => {
  const { t } = useTranslation();
  return useQuery({
    queryKey: [QUERY_KEYS.SECTS, religionId],
    queryFn: () => fetchSects(religionId),
    enabled: Boolean(religionId),
    refetchOnWindowFocus: false,
    retry: 2,
    onError: (error) => {
      toast.error(t("failed_fetch_sects"));
    },
  });
};

export const useRelationshipTypes = () => {
  const { t } = useTranslation();
  return useQuery({
    queryKey: [QUERY_KEYS.RELATIONSHIP_TYPES],
    queryFn: fetchRelationshipTypes,
    refetchOnWindowFocus: false,
    retry: 2,
    onError: (error) => {
      toast.error(t("failed_fetch_relationship_types"));
    },
  });
};

export const useOccupations = () => {
  const { t } = useTranslation();
  return useQuery({
    queryKey: [QUERY_KEYS.OCCUPATIONS],
    queryFn: fetchOccupations,
    refetchOnWindowFocus: false,
    retry: 2,
    onError: (error) => {
      toast.error(t("failed_fetch_occupations"));
    },
  });
};

export const useReactionTypes = () => {
  const { t } = useTranslation();
  return useQuery({
    queryKey: [QUERY_KEYS.REACTION_TYPES],
    queryFn: fetchReactionTypes,
    refetchOnWindowFocus: false,
    retry: 2,
    onError: (error) => {
      toast.error(t("failed_fetch_reaction_types"));
    },
  });
};

export const useBloodGroups = () => {
  const { t } = useTranslation();
  return useQuery({
    queryKey: [QUERY_KEYS.BLOOD_GROUPS],
    queryFn: fetchBloodGroups,
    refetchOnWindowFocus: false,
    retry: 2,
    onError: (error) => {
      toast.error(t("failed_fetch_blood_groups"));
    },
  });
};

export const useEducationTypes = () => {
  const { t } = useTranslation();
  return useQuery({
    queryKey: [QUERY_KEYS.EDUCATION_TYPES],
    queryFn: fetchEducationTypes,
    refetchOnWindowFocus: false,
    retry: 2,
    onError: (error) => {
      toast.error(t("failed_fetch_education_types"));
    },
  });
};

export const useInterests = () => {
  const { t } = useTranslation();
  return useQuery({
    queryKey: [QUERY_KEYS.INTERESTS],
    queryFn: fetchInterests,
    refetchOnWindowFocus: false,
    retry: 2,
    onError: (error) => {
      toast.error(t("failed_fetch_interests"));
    },
  });
};

export const useCountries = () => {
  const { t } = useTranslation();
  return useQuery({
    queryKey: [QUERY_KEYS.COUNTRIES],
    queryFn: fetchCountries,
    refetchOnWindowFocus: false,
    retry: 2,
    onError: (error) => {
      toast.error(t("failed_fetch_countries"));
    },
  });
};

export const useLanguages = () => {
  const { t } = useTranslation();
  return useQuery({
    queryKey: [QUERY_KEYS.LANGUAGES],
    queryFn: fetchLanguages,
    refetchOnWindowFocus: false,
    retry: 2,
    onError: (error) => {
      toast.error(t("failed_fetch_languages"));
    },
  });
};

export const useAgeRanges = () => {
  const { t } = useTranslation();
  return useQuery({
    queryKey: [QUERY_KEYS.AGE_RANGES],
    queryFn: fetchAgeRanges,
    refetchOnWindowFocus: false,
    retry: 2,
    onError: (error) => {
      toast.error(t("failed_fetch_age_ranges"));
    },
  });
};

export const useSubCastes = (religionId, casteId) => {
  const { t } = useTranslation();
  return useQuery({
    queryKey: [QUERY_KEYS.CASTES, religionId, casteId],
    queryFn: () => fetchSubCastes(religionId, casteId),
    enabled: Boolean(religionId && casteId),
    refetchOnWindowFocus: false,
    retry: 2,
    onError: (error) => {
      toast.error(t("failed_fetch_sub_castes"));
    },
  });
};

export const useKincoinRewardEvents = () => {
  const { t } = useTranslation();
  return useQuery({
    queryKey: [QUERY_KEYS.KINCOIN_REWARD_EVENTS],
    queryFn: fetchKincoinRewardEvents,
    refetchOnWindowFocus: false,
    retry: 2,
    onError: (error) => {
      toast.error(t("failed_fetch_kincoin_events"));
    },
  });
};
