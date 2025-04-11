import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import AsyncComponent from "@/components/async-component";
import { route_foreroom } from "@/constants/routeEnpoints";
import { NavLink } from "react-router";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import toast from "react-hot-toast";
import { useCreatePost } from "@/hooks/usePosts";
import { useNavigate } from "react-router";
import CustomDateMonthYearPicker from "@/components/custom-ui/custom-dateMonthYearPicker";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { addDays, addWeeks } from "date-fns";
import { useTranslation } from "react-i18next";
import { useKincoinRewardEvents } from "@/hooks/useMasters";
import { useConfettiStore } from "@/services/confettiStore";

export default function CreatePoll() {
  const { t } = useTranslation();
  const { data: rewardEvents } = useKincoinRewardEvents();
  const coinEarnable = parseInt(
    rewardEvents?.find((event) => event.name === "add_post")?.coins
  );
  const openConfetti = useConfettiStore((state) => state.openConfetti);

  const DURATION_OPTIONS = [
    {
      value: "1day",
      label: t("duration_1_day"),
      getDuration: (start) => addDays(start, 1),
    },
    {
      value: "2days",
      label: t("duration_2_days"),
      getDuration: (start) => addDays(start, 2),
    },
    {
      value: "1week",
      label: t("duration_1_week"),
      getDuration: (start) => addWeeks(start, 1),
    },
    {
      value: "2weeks",
      label: t("duration_2_weeks"),
      getDuration: (start) => addWeeks(start, 2),
    },
  ];

  const pollSchema = z.object({
    question: z
      .string()
      .min(5, t("question_min_length"))
      .max(200, t("question_max_length")),
    pollOptions: z
      .array(
        z
          .string()
          .min(1, t("option_required"))
          .max(50, t("option_max_length"))
          .refine(
            (value) => value.trim().split(/\s+/).length <= 50,
            t("option_max_words")
          )
      )
      .min(2, t("min_options"))
      .max(4, t("max_options")),
    startDate: z.coerce.date({
      required_error: t("start_date_required"),
      invalid_type_error: t("invalid_date"),
    }),
    duration: z.string({
      required_error: t("duration_required"),
    }),
  });

  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    control,
  } = useForm({
    resolver: zodResolver(pollSchema),
    defaultValues: {
      question: "",
      pollOptions: ["", ""],
      startDate: new Date(),
      endDate: new Date(),
    },
  });

  const {
    mutate: createPost,
    isLoading: isCreatingPost,
    isPending,
  } = useCreatePost();
  const pollOptions = watch("pollOptions");

  const addOption = () => {
    if (pollOptions.length < 4) {
      setValue("pollOptions", [...pollOptions, ""]);
    }
  };

  const removeOption = (index) => {
    if (pollOptions.length > 2) {
      setValue(
        "pollOptions",
        pollOptions.filter((_, i) => i !== index)
      );
    }
  };

  const onSubmit = (data) => {
    const startDate = new Date(data.startDate);
    const selectedDuration = DURATION_OPTIONS.find(
      (opt) => opt.value === data.duration
    );
    const endDate = selectedDuration.getDuration(startDate);
    endDate.setHours(23, 59, 59, 999);

    const postData = {
      type: "poll",
      question: data.question.trim(),
      poll_options: data.pollOptions.map((opt) => opt.trim()),
      start_at: format(startDate, "yyyy-MM-dd"),
      end_at: format(endDate, "yyyy-MM-dd HH:mm:ss"),
      is_multi_vote_allowed: 0,
    };

    createPost(postData, {
      onSuccess: () => {
        openConfetti(100);
        navigate("/", { state: { newPost: true } });
      },
      onError: (error) => {
        toast.error(t("poll_creation_error"));
      },
    });
  };
  return (
    <AsyncComponent>
      <div className="w-full mx-auto lg:px-0 pb-6 rounded-2xl">
        <div className="flex items-center gap-4 mb-6">
          <NavLink
            to={route_foreroom}
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
        <Card className="w-full rounded-2xl">
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardHeader className="text-xl font-bold pb-2">
              {t("create_poll")}
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="flex items-center py-2 text-primary max-w-56 rounded-lg text-sm font-semibold">
                {t("you_will_earn")} {coinEarnable} {t("kincoins")}&nbsp;
                <img
                  src="/kincoinsImg/kintree_coin.svg"
                  className="w-[18px] h-[18px]"
                />
              </div>
              <div className="space-y-2">
                <Label>{t("question")}</Label>
                <Textarea
                  {...register("question")}
                  placeholder={t("question_placeholder")}
                  rows="4"
                />
                {errors.question && (
                  <p className="text-sm text-red-500">
                    {errors.question.message}
                  </p>
                )}
              </div>

              <div className="space-y-4">
                <Label>{t("options")}</Label>
                {pollOptions.map((_, index) => (
                  <div key={index} className="flex gap-2">
                    <div className="flex-1 relative">
                      <Input
                        {...register(`pollOptions.${index}`)}
                        placeholder={t("option") + " " + (index + 1)}
                        className="rounded-full h-10 md:h-12 px-4 md:px-6"
                        maxLength={50}
                        onChange={(e) => {
                          if (e.target.value.length <= 50) {
                            setValue(`pollOptions.${index}`, e.target.value);
                          }
                        }}
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                        {watch(`pollOptions.${index}`)?.length || 0}/50
                      </span>
                    </div>
                    {pollOptions.length > 2 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeOption(index)}
                        className="rounded-full h-10 md:h-12 px-4 md:px-6"
                      >
                        <Trash2 className="h-4 w-4 hover:fill-red-500 hover:text-red-500 hover:cursor-pointer hover:bg-red-500/10 rounded-full" />
                      </Button>
                    )}
                  </div>
                ))}
                {errors.pollOptions && (
                  <p className="text-sm text-red-500">
                    {errors.pollOptions.message}
                  </p>
                )}
              </div>

              {pollOptions.length < 4 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={addOption}
                  className="rounded-full h-10 md:h-12 px-4 md:px-6"
                >
                  {t("add_option")}
                </Button>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label>{t("start_date")}</Label>
                  <Controller
                    control={control}
                    name="startDate"
                    render={({ field }) => (
                      <CustomDateMonthYearPicker
                        value={field.value}
                        onChange={field.onChange}
                        placeholder={t("select_start_date")}
                        minDate={new Date()}
                        className="rounded-full h-10 md:h-12 px-4 md:px-6"
                      />
                    )}
                  />
                  {errors.startDate && (
                    <p className="text-sm text-red-500">
                      {errors.startDate.message}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label>{t("duration")}</Label>
                <Controller
                  control={control}
                  name="duration"
                  render={({ field }) => (
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="grid grid-cols-2 md:grid-cols-4 gap-2"
                    >
                      {DURATION_OPTIONS.map((option) => (
                        <div key={option.value}>
                          <RadioGroupItem
                            value={option.value}
                            id={option.value}
                            className="peer hidden"
                          />
                          <Label
                            htmlFor={option.value}
                            className="flex px-2 py-4 text-center cursor-pointer rounded-full border border-primary 
                                peer-data-[state=checked]:border-primary 
                                peer-data-[state=checked]:bg-primary/10
                                hover:bg-muted/50"
                          >
                            {option.label}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  )}
                />
                {errors.duration && (
                  <p className="text-sm text-red-500">
                    {errors.duration.message}
                  </p>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button
                type="submit"
                disabled={isCreatingPost || isPending}
                className="rounded-full h-10 md:h-12 px-4 md:px-6"
              >
                {isCreatingPost ? t("creating_poll") : t("create_poll")}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </AsyncComponent>
  );
}
