import { Suspense } from "react";
import SignupPageContent from "./page-content";

export default function SignupPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "hsl(215 16% 47%)" }}>Loading...</div>}>
      <SignupPageContent />
    </Suspense>
  );
}
