import { LoginForm } from "@/components/login-form";
import { useOutletContext } from "react-router";
export default function Login() {
  const { setOpenTerms } = useOutletContext();
  return <LoginForm setOpenTerms={setOpenTerms} />;
}
