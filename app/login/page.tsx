import { Suspense } from "react";
import LoginPageContent from "./page-content";

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "hsl(215 16% 47%)" }}>Loading...</div>}>
      <LoginPageContent />
    </Suspense>
  );
}
