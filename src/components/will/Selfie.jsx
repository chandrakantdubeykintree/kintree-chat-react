import { useState, useRef } from "react";
import { useWill } from "@/hooks/useWill";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Camera, RefreshCcw } from "lucide-react";
import { toast } from "react-hot-toast";
import Webcam from "react-webcam";
import { useTranslation } from "react-i18next";

export default function Selfie({ setStep, willId }) {
  const { t } = useTranslation();
  const webcamRef = useRef(null);
  const { uploadSelfie, isUploadingSelfie } = useWill();

  const [showWebcam, setShowWebcam] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [uploadedImage, setUploadedImage] = useState(null);

  const handleCapture = () => {
    const imageSrc = webcamRef.current.getScreenshot();
    setCapturedImage(imageSrc);
    setShowWebcam(false);
  };

  const handleSubmit = async (file) => {
    try {
      let selfieFile;
      if (capturedImage) {
        const response = await fetch(capturedImage);
        const blob = await response.blob();
        selfieFile = new File([blob], "selfie.jpg", { type: "image/jpeg" });
      } else {
        selfieFile = file;
      }

      await uploadSelfie({ willId, selfieFile });
      // toast.success(t("selfie_uploaded_successfully"));
      setStep("notarize");
    } catch (error) {
      toast.error(t("error_failed_to_upload_selfie"));
    }
  };

  return (
    <div className="space-y-6">
      <div className="">
        <h2 className="text-xl font-semibold mb-2">
          {t("self_authentication")}
        </h2>
        <p className="text-gray-600 mb-6">
          {t("self_authentication_description")}
        </p>
        <h3 className="text-lg font-semibold mb-1">
          {t("selfie_instructions")}
        </h3>
        <ul className="list-disc list-inside text-gray-600 mb-2">
          <li>{t("selfie_instructions_1")}</li>
          <li>{t("selfie_instructions_2")}</li>
          <li>{t("selfie_instructions_3")}</li>
          <li>{t("selfie_instructions_4")}</li>
        </ul>

        {!showWebcam ? (
          <div className="grid gap-6">
            <Card className="p-6">
              <div className="flex flex-col items-center space-y-4">
                <Camera className="w-12 h-12 text-primary" />
                <h3 className="font-semibold">{t("take_a_selfie")}</h3>
                <Button
                  onClick={() => setShowWebcam(true)}
                  className="rounded-full h-10 md:h-12 px-4 md:px-6"
                >
                  {t("open_camera")}
                </Button>
              </div>
            </Card>
          </div>
        ) : null}

        {showWebcam && (
          <div className="mt-6">
            <Card className="p-2 md:p-4 lg:p-6 min-h-[250px]">
              <div className="relative flex flex-col justify-center items-center">
                <Webcam
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  className="w-full rounded-lg"
                />
              </div>

              <div className="flex justify-center items-center mt-8 flex-col sm:flex-row gap-2 sm:space-x-4 w-full sm:w-auto px-4 sm:px-0">
                <Button
                  onClick={handleCapture}
                  className="rounded-full h-10 md:h-12 px-4 md:px-6 w-full sm:w-auto"
                >
                  {t("capture_selfie")}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowWebcam(false)}
                  className="rounded-full h-10 md:h-12 px-4 md:px-6 w-full sm:w-auto"
                >
                  {t("cancel")}
                </Button>
              </div>
            </Card>
          </div>
        )}

        {(capturedImage || uploadedImage) && (
          <div className="mt-6">
            <Card className="p-4">
              <div className="relative">
                <img
                  src={capturedImage || uploadedImage}
                  alt="Preview"
                  className="w-full rounded-lg"
                />
                <Button
                  variant="outline"
                  className="absolute top-2 right-2"
                  onClick={() => {
                    setCapturedImage(null);
                    setUploadedImage(null);
                  }}
                >
                  <RefreshCcw className="w-4 h-4 mr-2" />
                  {t("retake_selfie")}
                </Button>
              </div>
              {capturedImage && (
                <div className="flex justify-center w-fit mx-auto">
                  <Button
                    className="mt-4 w-full rounded-full h-10 md:h-12 px-4 md:px-6"
                    onClick={() => handleSubmit()}
                    disabled={isUploadingSelfie}
                  >
                    {isUploadingSelfie ? t("uploading") : t("use_this_photo")}
                  </Button>
                </div>
              )}
            </Card>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-4">
        <Button
          variant="outline"
          onClick={() => setStep("review")}
          className="rounded-full h-10 md:h-12 px-4 md:px-6"
        >
          {t("back")}
        </Button>
      </div>
    </div>
  );
}
