import RegisterStepForm from "@/components/register-step-form";
import { Progress } from "@/components/ui/progress";
import { useThemeLanguage } from "@/context/ThemeLanguageProvider";
import { useEffect } from "react";
import { Navigate, useNavigate, useParams } from "react-router";
import { useAuthentication } from "@/hooks/useAuthentication";
import { toast } from "react-hot-toast";
import { tokenService } from "@/services/tokenService";
import { useTranslation } from "react-i18next";

export default function RegisterStep() {
  const { t } = useTranslation();
  const { theme } = useThemeLanguage();
  const navigate = useNavigate();
  const { step } = useParams();
  const { registerStep, registrationState } = useAuthentication();

  useEffect(() => {
    const handleNavigation = async () => {
      if (!registrationState) return;
      const hasRegistrationToken = tokenService.getRegistrationToken();
      const hasAuthToken = tokenService.getLoginToken();

      // If we have a registration token but registration isn't complete
      if (hasRegistrationToken && !registrationState?.isRegistrationComplete) {
        // Only remove login token if it exists
        if (hasAuthToken) {
          tokenService.removeLoginToken();
        }
        // Ensure we're on the correct step
        if (step !== registrationState.nextStep.toString()) {
          navigate(`/register/step/${registrationState.nextStep}`, {
            replace: true,
          });
        }
        return;
      }

      if (hasAuthToken) {
        navigate("/foreroom", { replace: true });
        return;
      }

      // If we don't have a registration token
      if (!hasRegistrationToken && !registrationState?.isRegistrationComplete) {
        toast.error(t("error_session_expired"));
        navigate("/register", { replace: true });
        return;
      }

      // If we have an auth token, redirect to foreroom
      if (hasAuthToken) {
        navigate("/foreroom", { replace: true });
        return;
      }
    };
    handleNavigation();
  }, [step, registrationState, navigate]);

  const handleStepSubmit = async (data) => {
    try {
      await registerStep(data);
    } catch (error) {
      toast.error(t("error_saving_registration_data"));
    }
  };

  if (!registrationState) {
    return null;
  }

  if (registrationState.isRegistrationComplete) {
    return <Navigate to="/foreroom" replace={true} />;
  }

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="relative hidden bg-muted lg:block">
        <img
          src="/illustrations/illustration_9.png"
          alt="Image"
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>
      <div className="flex flex-col gap-4 p-6 md:p-10 bg-[#F4ECF2] dark:bg-[#202020]">
        <div className="flex justify-center gap-2 md:justify-end">
          <img
            src={
              theme === "light" ? "/kintreeLogo.svg" : "/kintreeLogoLight.svg"
            }
            className="w-[60px] h-auto"
            alt="Kintree logo"
          />
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-md">
            <RegisterStepForm
              currentStep={registrationState.nextStep}
              onStepSubmit={handleStepSubmit}
              gender={registrationState?.gender || null}
            />
          </div>
        </div>
        <div className="flex items-center justify-center mb-12">
          <Progress
            value={Math.ceil((registrationState.nextStep / 6) * 100)}
            className="max-w-[250px] bg-[#F1B8A6] h-[9px]"
          />
        </div>
      </div>
    </div>
  );
}
