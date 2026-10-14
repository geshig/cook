import { Suspense } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { LoginForm } from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <>
      <SiteHeader />
      <Suspense>
        <LoginForm />
      </Suspense>
    </>
  );
}
