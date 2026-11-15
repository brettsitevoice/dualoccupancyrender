import { Suspense } from "react";
import { ScorecardScreen } from "@/components/ScorecardScreen";
import { LoadingScreen } from "@/components/ui";

export default function ScorecardPage() {
  return (
    <Suspense fallback={<LoadingScreen label="Adding it up" />}>
      <ScorecardScreen />
    </Suspense>
  );
}
