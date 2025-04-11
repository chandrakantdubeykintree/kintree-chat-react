import { ForgotUsernameForm } from "@/components/forgot-username-form";
import { useOutletContext } from "react-router";

export default function ForgotUsername() {
  const { setOpenTerms } = useOutletContext();
  return <ForgotUsernameForm setOpenTerms={setOpenTerms} />;
}
