import AsyncComponent from "@/components/async-component";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import {
  useDeleteAttachment,
  useUploadAttachment,
} from "@/hooks/useAttachments";
import { useCreateRecipe } from "@/hooks/useRecipes";
import { route_foreroom } from "@/constants/routeEnpoints";
import { Loader2, GripVertical, Trash2, X, Replace } from "lucide-react";
import { useFieldArray, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { NavLink, useNavigate } from "react-router";
import { DragDropContext, Draggable, Droppable } from "react-beautiful-dnd";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import * as z from "zod";
import PrivacyDropdown from "@/components/privacy-dropdown";
import { useRecipeCategories } from "@/hooks/useMasters";
import { PRIVACYDROPDOWN } from "@/constants/dropDownConstants copy";
import { ADD_IMAGE_PLACEHOLDER } from "@/constants/iconUrls";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useEffect } from "react";

const ImageDialog = ({ isOpen, onClose, item }) => {
  if (!item?.url) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      {/* --- Dialog Content: Main modal container --- */}
      <DialogContent
        className="p-0 rounded-lg w-[90vw] h-[90vh] max-w-[1200px] max-h-[800px] overflow-hidden flex flex-col"
        style={{ padding: 0 }}
      >
        <div className="relative flex-1 w-full h-full flex items-center justify-center bg-black">
          <div
            className="absolute inset-0 blur-xl opacity-30 z-0"
            style={{
              backgroundImage: `url(${item.url})`,
              backgroundPosition: "center",
              backgroundSize: "cover",
            }}
            aria-hidden="true"
          />
          <div className="relative z-10 w-full h-full flex items-center justify-center">
            <img
              src={item.url}
              alt={item.name || "Image Preview"}
              className="block w-full h-full object-contain"
            />
          </div>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 transition-colors z-20"
            aria-label="Close image dialog"
          >
            <X className="h-5 w-5 text-white" />
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default function CreateRecipe() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  // const openConfetti = useConfettiStore((state) => state.openConfetti);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const isFieldEmpty = (text) => !text || text.trim() === "";
  const [selectedPrivacy, setSelectedPrivacy] = useState(
    () => PRIVACYDROPDOWN[0]
  );
  const {
    data: recipeCategories,
    isLoading: recipeCategoriesLoading,
    isError: recipeCategoriesError,
  } = useRecipeCategories();
  const { mutateAsync: uploadAttachment, isLoading: isAttachmentUploading } =
    useUploadAttachment();
  const { mutateAsync: createRecipe, isLoading: isRecipeCreating } =
    useCreateRecipe();
  const { mutateAsync: deleteAttachment } = useDeleteAttachment();

  const createRecipeSchema = z.object({
    title: z
      .string()
      .min(1, t("validation_title_required"))
      .max(100, t("validation_title_max_length")),

    description: z
      .string()
      .min(1, t("validation_description_required"))
      .max(1000, t("validation_description_max_length")),

    attachment_id: z.number().nullable().optional(),

    duration: z
      .number()
      .min(1, t("validation_duration_min"))
      .max(180, t("validation_duration_max")),

    recipe_category_id: z.string().min(1, t("validation_category_required")),

    privacy: z.number().min(1).max(4),

    ingredients: z
      .array(
        z.object({
          text: z
            .string()
            .min(1, t("validation_ingredient_text_required"))
            .max(100, t("validation_ingredient_max_length")),
        })
      )
      .min(1, t("validation_ingredients_min")),

    steps: z
      .array(
        z.object({
          description: z
            .string()
            .min(1, t("validation_step_description_required"))
            .max(1000, t("validation_step_description_max_length")),
          attachment_id: z.number().nullable().optional(),
        })
      )
      .min(1, t("validation_steps_min")),
  });

  const form = useForm({
    defaultValues: {
      title: "",
      description: "",
      attachment_id: null,
      duration: 30,
      recipe_category_id: "",
      privacy: 4,
      ingredients: [{ text: "" }],
      steps: [{ description: "", attachment_id: null }],
    },
    resolver: zodResolver(createRecipeSchema),
  });

  const {
    fields: ingredientFields,
    append: appendIngredient,
    remove: removeIngredient,
    move: moveIngredient,
  } = useFieldArray({
    control: form.control,
    name: "ingredients",
  });

  const {
    fields: stepFields,
    append: appendStep,
    remove: removeStep,
  } = useFieldArray({
    control: form.control,
    name: "steps",
  });

  const onDragEnd = (result) => {
    if (!result.destination) return;
    moveIngredient(result.source.index, result.destination.index);
  };

  const validateImageType = (file) => {
    const validTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/svg+xml",
    ];
    if (!validTypes.includes(file.type)) {
      return false;
    }
    return true;
  };

  const handleAddIngredient = () => {
    const currentIngredients = form.getValues("ingredients");
    const lastIngredient = currentIngredients[currentIngredients.length - 1];

    if (!lastIngredient?.text || lastIngredient.text.trim() === "") {
      toast.error(t("please_fill_current_ingredient"));
      return;
    }
    appendIngredient({ text: "" });
  };

  const handleRemoveIngredient = (index) => {
    const currentIngredients = form.getValues("ingredients");
    if (currentIngredients.length === 1) {
      return;
    }
    removeIngredient(index);
  };

  const watchIngredients = form.watch("ingredients");

  useEffect(() => {
    const currentIngredients = form.getValues("ingredients");

    if (currentIngredients.length <= 1) return;

    const emptyIngredients = currentIngredients
      .map((ing, index) => ({ ...ing, index }))
      .filter(
        (ing, index) =>
          (!ing.text || ing.text.trim() === "") &&
          index !== currentIngredients.length - 1
      );

    [...emptyIngredients].reverse().forEach((ing) => {
      removeIngredient(ing.index);
    });
  }, [watchIngredients]);

  const handleAddStep = () => {
    const currentSteps = form.getValues("steps");
    const lastStep = currentSteps[currentSteps.length - 1];

    if (!lastStep?.description || lastStep.description.trim() === "") {
      toast.error(t("please_fill_current_step"));
      return;
    }
    appendStep({ description: "", attachment_id: null });
  };

  const handleRemoveStep = (index) => {
    const currentSteps = form.getValues("steps");
    if (currentSteps.length === 1) {
      return;
    }
    removeStep(index);
  };

  const watchSteps = form.watch("steps");

  useEffect(() => {
    const currentSteps = form.getValues("steps");

    if (currentSteps.length <= 1) return;

    const emptySteps = currentSteps
      .map((step, index) => ({ ...step, index }))
      .filter(
        (step, index) =>
          (!step.description || step.description.trim() === "") &&
          index !== currentSteps.length - 1
      );

    [...emptySteps].reverse().forEach((step) => {
      removeStep(step.index);
    });
  }, [watchSteps]);

  // Update the handleImageUpload function
  const handleImageUpload = async (file, fieldName) => {
    try {
      if (!validateImageType(file)) {
        toast.error(t("invalid_image_format"));
        return;
      }

      setIsUploading(true);
      const formData = new FormData();
      formData.append("files[]", file);

      const response = await uploadAttachment(formData);
      if (response?.data?.[0]?.id) {
        form.setValue(fieldName, response.data[0].id);
        form.setValue(fieldName + "_url", response.data[0].url);
        toast.success(t("image_uploaded_successfully"));
      }
    } catch (error) {
      console.error("Upload failed:", error);
      toast.error(t("failed_to_upload_image"));
    } finally {
      setIsUploading(false);
    }
  };

  // Update the handleStepImageUpload function
  const handleStepImageUpload = async (file, index) => {
    try {
      if (!validateImageType(file)) {
        toast.error(t("invalid_image_format"));
        return;
      }

      setIsUploading(true);
      const formData = new FormData();
      formData.append("files[]", file);
      const response = await uploadAttachment(formData);
      if (response?.data?.[0]?.id) {
        form.setValue(`steps.${index}.attachment_id`, response.data[0].id);
        form.setValue(`steps.${index}.attachment_url`, response.data[0].url);
        toast.success(t("step_image_uploaded_successfully"));
      }
    } catch (error) {
      console.error("Upload failed:", error);
      toast.error(t("failed_to_upload_step_image"));
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      setIsSubmitting(true);
      const filteredIngredients = data.ingredients
        .filter((ing) => ing.text.trim() !== "")
        .map((ing) => ing.text.trim());

      // Filter out empty steps
      const filteredSteps = data.steps
        .filter((step) => step.description.trim() !== "")
        .map((step) => ({
          description: step.description.trim(),
          attachment_id: step.attachment_id,
        }));

      if (filteredIngredients.length === 0) {
        toast.error(t("validation_ingredients_min"));
        return;
      }

      if (filteredSteps.length === 0) {
        toast.error(t("validation_steps_min"));
        return;
      }

      const jsonData = {
        title: data.title,
        description: data.description,
        attachment_id: data.attachment_id,
        duration: data.duration * 60,
        recipe_category_id: data.recipe_category_id,
        privacy: data.privacy,
        ingredients: filteredIngredients,
        steps: filteredSteps,
      };

      // Create recipe
      const response = await createRecipe(jsonData);
      // console.log(response);

      toast.success(t("recipe_created_successfully"));
      navigate("/foreroom?tab=recipes");
    } catch (error) {
      console.error("Failed to create recipe:", error);
      toast.error(t("failed_to_create_recipe"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const ImageContainer = ({
    url,
    attachmentId,
    onDelete,
    onChangeImage,
    isUploading,
  }) => {
    return (
      <>
        <div className="relative h-full w-full overflow-hidden rounded-2xl p-4">
          {/* Blurred background image */}
          <div
            className="absolute inset-0 blur-xl scale-110"
            style={{
              backgroundImage: `url(${url})`,
              backgroundPosition: "center",
              backgroundSize: "cover",
              opacity: "0.5",
            }}
          />

          {/* Main centered image */}
          <div className="relative h-full w-full flex items-center justify-center">
            <img
              src={url}
              alt="Upload"
              onClick={() => setIsDialogOpen(true)}
              className="max-h-full max-w-full object-contain cursor-pointer hover:opacity-95 transition-opacity rounded-2xl"
            />
          </div>

          {/* Control buttons */}
          <div className="absolute top-2 right-2 flex flex-col gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={onChangeImage}
              disabled={isUploading}
              className="bg-white hover:bg-gray-100"
              title="Replace Image"
            >
              <Replace className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              onClick={async () => {
                if (attachmentId) {
                  await deleteAttachment(attachmentId);
                }
                onDelete();
              }}
              disabled={isUploading}
              className="bg-white hover:bg-red-50"
              title="Delete Image"
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        </div>

        {/* Image Dialog */}
        <ImageDialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          item={{ url, name: "Image" }}
        />
      </>
    );
  };

  const ImageContainerStep = ({
    url,
    attachmentId,
    onDelete,
    onChangeImage,
    isUploading,
  }) => {
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    return (
      <>
        <div className="relative h-full w-full overflow-hidden rounded-2xl p-4">
          {/* Blurred background image */}
          <div
            className="absolute inset-0 blur-xl scale-110"
            style={{
              backgroundImage: `url(${url})`,
              backgroundPosition: "center",
              backgroundSize: "cover",
              opacity: "0.5",
            }}
          />

          {/* Main centered image */}
          <div className="relative h-full w-full flex items-center justify-center">
            <img
              src={url}
              alt="Step Image"
              onClick={() => setIsDialogOpen(true)}
              className="max-h-full w-auto object-contain cursor-pointer hover:opacity-95 transition-opacity rounded-2xl"
            />
          </div>

          {/* Control buttons */}
          <div className="absolute top-2 right-2 flex flex-col gap-2 z-10">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={onChangeImage}
              disabled={isUploading}
              className="bg-white hover:bg-gray-100"
              title="Replace Image"
            >
              <Replace className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              onClick={async () => {
                if (attachmentId) {
                  await deleteAttachment(attachmentId);
                }
                onDelete();
              }}
              disabled={isUploading}
              className="bg-white hover:bg-red-50"
              title="Delete Image"
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        </div>
        {/* Image Dialog */}
        <ImageDialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          item={{ url, name: "Image" }}
        />
      </>
    );
  };

  return (
    <AsyncComponent>
      <div className="w-full mx-auto lg:px-0 pb-6 rounded-2xl">
        <div className="flex items-center gap-4 mb-6">
          <NavLink
            to={route_foreroom + "?tab=recipes"}
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

        <Card className="w-full pt-4">
          <CardContent className="p-2 md:p-4">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <div className="flex justify-between">
                  <h2 className="text-2xl font-bold">
                    {t("create_new_recipe")}
                  </h2>
                  <FormField
                    control={form.control}
                    name="privacy"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <PrivacyDropdown
                            selectedPrivacy={selectedPrivacy}
                            setSelectedPrivacy={(privacy) => {
                              setSelectedPrivacy(privacy);
                              field.onChange(privacy.id);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="attachment_id"
                  render={({ field }) => (
                    <FormItem>
                      <div className="h-[200px] relative">
                        {field.value ? (
                          <ImageContainer
                            url={form.watch("attachment_id_url")}
                            attachmentId={field.value}
                            onDelete={async () => {
                              form.setValue("attachment_id", null);
                              form.setValue("attachment_id_url", null);
                            }}
                            onChangeImage={() =>
                              document.getElementById("recipeImage").click()
                            }
                            isUploading={isUploading}
                          />
                        ) : (
                          <div
                            className={cn(
                              "border-2 border-dashed rounded-2xl h-full w-full flex items-center justify-center cursor-pointer hover:bg-gray-50",
                              isUploading && "opacity-50 cursor-not-allowed"
                            )}
                            onClick={() =>
                              !isUploading &&
                              document.getElementById("recipeImage").click()
                            }
                          >
                            <div className="text-center">
                              {isUploading ? (
                                <div className="flex flex-col items-center">
                                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                                  <p className="mt-2 text-sm text-gray-500">
                                    {t("uploading")}
                                  </p>
                                </div>
                              ) : (
                                <>
                                  {/* <ImagePlus className="mx-auto h-12 w-12 text-gray-400" /> */}
                                  <img
                                    src={ADD_IMAGE_PLACEHOLDER}
                                    className="h-12 w-12 mx-auto"
                                  />
                                  <p className="mt-2 text-sm text-gray-500">
                                    {t("click_to_upload_image")}
                                  </p>
                                  <p className="mt-1 text-xs text-gray-400">
                                    {t("supported_formats")}: PNG, JPG, GIF
                                  </p>
                                </>
                              )}
                            </div>
                          </div>
                        )}

                        <input
                          id="recipeImage"
                          type="file"
                          className="hidden"
                          accept="image/jpeg,image/png,image/gif,image/svg+xml"
                          disabled={isUploading}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleImageUpload(file, "attachment_id");
                          }}
                        />
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Food Name */}
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          placeholder={t("enter_food_name")}
                          {...field}
                          className="rounded-2xl"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Category Dropdown */}
                <FormField
                  control={form.control}
                  name="recipe_category_id"
                  render={({ field }) => (
                    <FormItem>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="rounded-2xl">
                            <SelectValue placeholder={t("select_category")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-2xl">
                          {recipeCategories?.map((category) => (
                            <SelectItem
                              key={category.id}
                              value={category.id.toString()}
                            >
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Description */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea
                          placeholder={t("enter_recipe_description")}
                          className="resize-none rounded-2xl"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Cooking Duration Slider */}
                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex flex-col gap-6">
                        <FormLabel>{t("cooking_duration")}</FormLabel>
                        <FormControl>
                          <div className="space-y-2">
                            <div className="relative w-full">
                              <div className="absolute w-full flex justify-between">
                                {Array.from(
                                  { length: 3 },
                                  (_, i) => i * 90
                                ).map((value) => (
                                  <div
                                    key={value}
                                    className="flex flex-col items-center"
                                  >
                                    <div className="h-1 w-1 rounded-full bg-foreground"></div>
                                  </div>
                                ))}
                              </div>
                              <div className="pt-6">
                                <Slider
                                  min={0}
                                  max={180}
                                  step={1}
                                  value={[field.value]}
                                  onValueChange={(value) =>
                                    field.onChange(value[0])
                                  }
                                  className="w-full"
                                />
                              </div>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>1 {t("min")}</span>
                              <span className="font-bold">
                                {field.value > 59
                                  ? `${Math.floor(field.value / 60)}${t("h")} ${
                                      field.value % 60
                                    }${t("min")}`
                                  : `${field.value} ${t("mins")}`}
                              </span>
                              <span>180 {t("mins")}</span>
                            </div>
                          </div>
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* Ingredients List */}
                <div className="space-y-4">
                  <FormLabel>{t("ingredients")}</FormLabel>
                  <FormField
                    control={form.control}
                    name="ingredients"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormControl>
                          <DragDropContext onDragEnd={onDragEnd}>
                            <Droppable droppableId="ingredients">
                              {(provided) => (
                                <div
                                  {...provided.droppableProps}
                                  ref={provided.innerRef}
                                  className="space-y-2"
                                >
                                  {ingredientFields.map((field, index) => (
                                    <Draggable
                                      key={field.id}
                                      draggableId={field.id}
                                      index={index}
                                    >
                                      {(provided, snapshot) => (
                                        <div
                                          ref={provided.innerRef}
                                          {...provided.draggableProps}
                                          className={`flex items-center gap-2 p-2 rounded-2xl border ${
                                            snapshot.isDragging
                                              ? "bg-gray-50 border-primary"
                                              : ""
                                          }`}
                                        >
                                          <div
                                            {...provided.dragHandleProps}
                                            className="cursor-move px-2"
                                          >
                                            <GripVertical className="h-5 w-5 text-gray-400" />
                                          </div>
                                          <FormField
                                            control={form.control}
                                            name={`ingredients.${index}.text`}
                                            render={({ field }) => (
                                              <FormItem className="flex-1">
                                                <FormControl>
                                                  <Input
                                                    {...field}
                                                    placeholder="Enter ingredient"
                                                    maxLength={100}
                                                    className="rounded-2xl"
                                                  />
                                                </FormControl>
                                                <FormMessage />
                                              </FormItem>
                                            )}
                                          />
                                          {ingredientFields.length > 1 && (
                                            <Button
                                              type="button"
                                              variant="ghost"
                                              size="sm"
                                              onClick={() =>
                                                handleRemoveIngredient(index)
                                              }
                                            >
                                              <Trash2 className="h-4 w-4 text-red-500" />
                                            </Button>
                                          )}
                                        </div>
                                      )}
                                    </Draggable>
                                  ))}
                                  {provided.placeholder}
                                </div>
                              )}
                            </Droppable>
                          </DragDropContext>
                        </FormControl>
                        {/* <FormMessage /> */}
                      </FormItem>
                    )}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddIngredient}
                    className="rounded-2xl"
                  >
                    {t("add_ingredient")}
                  </Button>
                </div>

                {/* Steps Section */}
                <div className="space-y-4">
                  <FormLabel>{t("steps")}</FormLabel>
                  {stepFields.map((field, index) => (
                    <div
                      key={field.id}
                      className="space-y-4 p-4 border rounded-2xl bg-white"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <FormField
                            control={form.control}
                            name={`steps.${index}.description`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm text-gray-600">
                                  {t("step_number", { number: index + 1 })}
                                </FormLabel>
                                <FormControl>
                                  <Textarea
                                    placeholder={t("add_step")}
                                    {...field}
                                    className="resize-none rounded-xl"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        {stepFields.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveStep(index)}
                            className="mt-6"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        )}
                      </div>

                      {/* Step Image Upload */}
                      <FormField
                        control={form.control}
                        name={`steps.${index}.attachment_id`}
                        render={({ field }) => (
                          <FormItem>
                            <div className="h-[150px] relative">
                              {field.value ? (
                                <ImageContainerStep
                                  url={form.watch(
                                    `steps.${index}.attachment_url`
                                  )}
                                  attachmentId={field.value}
                                  onDelete={async () => {
                                    form.setValue(
                                      `steps.${index}.attachment_id`,
                                      null
                                    );
                                    form.setValue(
                                      `steps.${index}.attachment_url`,
                                      null
                                    );
                                  }}
                                  onChangeImage={() =>
                                    document
                                      .getElementById(`stepImage${index}`)
                                      .click()
                                  }
                                  isUploading={isUploading}
                                />
                              ) : (
                                <div
                                  className={cn(
                                    "border-2 border-dashed rounded-2xl h-full w-full flex items-center justify-center cursor-pointer hover:bg-gray-50",
                                    isUploading &&
                                      "opacity-50 cursor-not-allowed"
                                  )}
                                  onClick={() =>
                                    !isUploading &&
                                    document
                                      .getElementById(`stepImage${index}`)
                                      .click()
                                  }
                                >
                                  <div className="text-center">
                                    {isUploading ? (
                                      <div className="flex flex-col items-center">
                                        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                                        <p className="mt-2 text-sm text-gray-500">
                                          {t("uploading")}
                                        </p>
                                      </div>
                                    ) : (
                                      <>
                                        {/* <ImagePlus className="mx-auto h-8 w-8 text-gray-400" /> */}
                                        <img
                                          src={ADD_IMAGE_PLACEHOLDER}
                                          className="h-12 w-12 mx-auto"
                                        />
                                        <p className="mt-2 text-sm text-gray-500">
                                          {t("add_step_image")}
                                        </p>
                                        <p className="mt-1 text-xs text-gray-400">
                                          {t("optional")}
                                        </p>
                                      </>
                                    )}
                                  </div>
                                </div>
                              )}

                              <input
                                id={`stepImage${index}`}
                                type="file"
                                className="hidden"
                                accept="image/jpeg,image/png,image/gif,image/svg+xml"
                                disabled={isUploading}
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleStepImageUpload(file, index);
                                }}
                              />
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  ))}
                  <div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleAddStep}
                      className="rounded-2xl"
                    >
                      {t("add_step")}
                    </Button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full rounded-2xl"
                  disabled={isSubmitting || isUploading}
                >
                  {isSubmitting ? (
                    <div className="flex items-center">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t("creating_recipe")}
                    </div>
                  ) : (
                    t("create_recipe")
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </AsyncComponent>
  );
}
