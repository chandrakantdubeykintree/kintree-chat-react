import { ForgotPasswordForm } from "@/components/forgot-password-form";
import { useOutletContext } from "react-router";
export default function ForgotPassword() {
  const { setOpenTerms } = useOutletContext();
  return <ForgotPasswordForm setOpenTerms={setOpenTerms} />;
}
