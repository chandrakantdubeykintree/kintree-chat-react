import AsyncComponent from "@/components/async-component";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { useRecipe } from "@/hooks/useRecipes";
import { decryptId, encryptId } from "@/utils/encryption";
import { useTranslation } from "react-i18next";
import { NavLink, useNavigate, useParams } from "react-router";
import ComponentLoading from "@/components/component-loading";
import { Badge } from "@/components/ui/badge";
import { capitalizeName, getInitials } from "@/utils/stringFormat";
import { Clock, ImageOff, X, ZoomIn } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useState } from "react";
import Masonry from "@/components/masonary";
import CustomCarousel from "@/components/custom-carousel";
import { route_foreroom } from "@/constants/routeEnpoints";

const ImageDialog = ({ isOpen, onClose, item }) => {
  if (!item?.url) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="p-0 rounded-lg overflow-hidden w-[90vw] h-[90vh] max-w-[700px] max-h-[500px]">
        <div className="relative w-full h-full flex items-center justify-center bg-black/50">
          {/* Blurred background */}
          <div
            className="absolute inset-0 blur-xl scale-110 opacity-30"
            style={{
              backgroundImage: `url(${
                typeof item === "string" ? item : item.url
              })`,
              backgroundPosition: "center",
              backgroundSize: "cover",
            }}
          />

          {/* Main image */}
          <div className="relative w-full h-full flex items-center justify-center p-4">
            <img
              src={typeof item === "string" ? item : item.url}
              alt={typeof item === "string" ? "Image" : item.name}
              className="max-w-full max-h-full w-auto h-auto object-contain"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default function ViewRecipe() {
  const { t } = useTranslation();
  const { id: encryptedId } = useParams();
  const navigate = useNavigate();
  const id = decryptId(encryptedId);

  const [selectedImage, setSelectedImage] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: recipe, isLoading } = useRecipe(id);

  if (isLoading) return <ComponentLoading />;

  const handleMasonryImageClick = (imageSrc) => {
    setSelectedImage(imageSrc);
    setIsDialogOpen(true);
  };

  const handleImageClick = (image) => {
    setSelectedImage(image);
    setIsDialogOpen(true);
  };

  const {
    post_data: {
      title,
      description,
      attachment,
      ingredients,
      steps,
      duration,
      category,
      related_recipes,
    },
    author_details,
    created_at,
  } = recipe;

  const ImageContainer = ({
    url,
    title,
    onClick,
    height = "h-[200px] md:h-[300px]",
  }) => {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    const handleImageClick = () => {
      if (!hasError && !isLoading) {
        setIsDialogOpen(true);
        onClick?.();
      }
    };

    if (!url) {
      return (
        <div
          className={`w-full ${height} bg-muted rounded-2xl flex items-center justify-center`}
        >
          <ImageOff className="w-8 h-8 text-muted-foreground" />
        </div>
      );
    }

    return (
      <>
        <div
          className={`w-full ${height} relative rounded-2xl group cursor-pointer overflow-hidden`}
        >
          {/* Loading state */}
          {isLoading && (
            <div className="absolute inset-0 animate-pulse bg-muted" />
          )}

          {/* Error state */}
          {hasError && (
            <div className="absolute inset-0 bg-muted flex items-center justify-center">
              <ImageOff className="w-8 h-8 text-muted-foreground" />
            </div>
          )}

          {/* Image with blur background */}
          {!hasError && (
            <>
              {!isLoading && (
                <div
                  className="absolute inset-0 blur-xl scale-110"
                  style={{
                    backgroundImage: `url(${url})`,
                    backgroundPosition: "center",
                    backgroundSize: "cover",
                    opacity: "0.5",
                  }}
                />
              )}

              <div className="relative h-full w-full flex items-center justify-center p-4 rounded-2xl">
                <img
                  src={url}
                  alt={title}
                  className={`h-full w-auto max-w-full object-contain rounded-2xl transition-opacity duration-300 ${
                    isLoading ? "opacity-0" : "opacity-100"
                  }`}
                  onLoad={() => setIsLoading(false)}
                  onError={() => {
                    setIsLoading(false);
                    setHasError(true);
                  }}
                  onClick={handleImageClick}
                />

                {/* Hover overlay */}
                {!isLoading && !hasError && (
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                    <ZoomIn
                      className="text-white opacity-0 group-hover:opacity-100 transition-all"
                      size={24}
                    />
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <ImageDialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          item={{ url, name: title }}
        />
      </>
    );
  };

  const RelatedRecipes = ({ related_recipes }) => {
    if (!related_recipes?.length) return null;

    return (
      <div className="px-4">
        <h2 className="text-xl font-semibold mb-4">{t("related_recipes")}</h2>
        <CustomCarousel
          items={related_recipes}
          itemWidth={192}
          gap={16}
          autoplay={true}
          infinite={true}
          showArrows={false}
          showDots={false}
          renderItem={(recipe) => (
            <div
              className="cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => navigate(`/view-recipe/${encryptId(recipe.id)}`)}
            >
              <div className="rounded-lg overflow-hidden border">
                <div className="h-32 overflow-hidden relative">
                  {recipe.attachment?.url ? (
                    <img
                      src={recipe.attachment.url}
                      alt={recipe.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        e.target.parentElement.innerHTML = `
                          <div class="w-full h-full bg-muted flex items-center justify-center">
                            <svg class="w-6 h-6 text-muted-foreground" ...> // ImageOff icon SVG
                          </div>
                        `;
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <ImageOff className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="font-medium text-sm line-clamp-2 text-foreground">
                    {recipe.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {recipe.category?.name}
                  </p>
                </div>
              </div>
            </div>
          )}
        />
      </div>
    );
  };

  return (
    <AsyncComponent>
      <Card className="bg-background rounded-2xl h-full overflow-y-auto p-2 md:p-4 no_scrollbar">
        <div className="relative">
          {/* Main Image */}
          <div
            className="w-full h-[200px] md:h-[300px] relative rounded-2xl group cursor-pointer"
            onClick={() => handleImageClick(attachment)}
          >
            <ImageContainer url={attachment?.url} title={title} />
            <NavLink
              to={route_foreroom + "?tab=recipes"}
              onClick={(e) => {
                e.stopPropagation();
                // e.preventDefault();
              }}
              className="flex items-center absolute top-4 left-4 bg-sky-50 hover:bg-brandPrimary rounded-full p-2 text-brandPrimary hover:text-white"
            >
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
            </NavLink>
          </div>

          <div className="pt-4 md:pt-6 px-2 md:px-4">
            {/* Recipe Header */}
            <div className="mb-4">
              <div className="flex flex-col md:flex-row md:justify-between mb-2">
                <h1 className="text-xl md:text-2xl font-bold mb-2">{title}</h1>
                <div className="flex gap-2 items-center text-[14px] md:text-[16px] text-gray-500 dark:text-gray-400">
                  <Clock className="w-4 h-4" />
                  {Math.floor(duration / 60)} mins
                </div>
              </div>
              <p className="text-muted-foreground text-sm md:text-base">
                {description}
              </p>
            </div>

            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Badge color="secondary" className="rounded-full px-3 py-1">
                  {category?.name}
                </Badge>
              </div>
            </div>

            {/* Ingredients */}
            <div className="mb-6 shadow-md border rounded-2xl px-3 md:px-6 py-4">
              <div className="flex justify-between mb-4">
                <h2 className="text-lg md:text-xl font-semibold">
                  {t("ingredients")}
                </h2>
                <div className="text-sm md:text-base text-muted-foreground">
                  {ingredients?.length} {t("items")}
                </div>
              </div>
              <ul className="space-y-2 list-decimal list-inside grid grid-cols-1 md:grid-cols-2 gap-2">
                {ingredients?.map((ingredient) => (
                  <li key={ingredient.id} className="text-sm md:text-base mt-2">
                    {ingredient.name}
                  </li>
                ))}
              </ul>
            </div>

            {/* Instructions */}
            <div className="mb-6 shadow-md border p-4 rounded-2xl">
              <h2 className="text-lg md:text-xl font-semibold mb-4">
                {t("instructions")}
              </h2>
              <div className="space-y-4 md:space-y-6">
                {steps?.map((step, index) => (
                  <div
                    key={step.id}
                    className="rounded-2xl p-3 md:p-4 border border-primary"
                  >
                    <div className="flex gap-2">
                      <div className="flex-shrink-0 bg-primary text-primary-foreground w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center font-semibold text-sm md:text-base">
                        {index + 1}
                      </div>
                      <div className="flex-1 text-sm md:text-base pt-0.5">
                        {step.description}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {steps?.length > 0 && (
                <div className="mt-6">
                  <Masonry
                    images={steps.map((step) => step?.attachment?.url)}
                    onImageClick={handleMasonryImageClick}
                  />
                </div>
              )}
            </div>

            {/* Author Details */}
            <div className="px-4">
              <div className="text-xl font-semibold mb-4">{t("creator")}</div>
              <div className="flex items-center gap-4 mb-6">
                <Avatar className="h-12 w-12 border">
                  <AvatarImage src={author_details?.profile_pic_url} />
                  <AvatarFallback>
                    {getInitials(author_details?.first_name) +
                      " " +
                      getInitials(author_details?.last_name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">
                    {capitalizeName(author_details?.first_name) +
                      " " +
                      capitalizeName(author_details?.last_name)}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {author_details?.bio || "--"}
                  </p>
                </div>
              </div>
            </div>

            {/* Related Recipes */}
            {related_recipes?.length > 0 && (
              <RelatedRecipes related_recipes={related_recipes} />
            )}

            {isDialogOpen ? (
              <ImageDialog
                isOpen={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
                item={selectedImage}
              />
            ) : null}
          </div>
        </div>
      </Card>
    </AsyncComponent>
  );
}
