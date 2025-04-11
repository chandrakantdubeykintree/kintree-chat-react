import { RegisterForm } from "@/components/register-form";
import { tokenService } from "@/services/tokenService";
import { useOutletContext } from "react-router";
export default function Register() {
  const { setOpenTerms } = useOutletContext();
  if (tokenService.getLoginToken) {
    tokenService.removeLoginToken();
  }
  return <RegisterForm setOpenTerms={setOpenTerms} />;
}
