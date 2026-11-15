import { Suspense } from "react";
import { LoadingScreen } from "@/components/ui";
import { PhotoReviewPage } from "./review";

export default function PhotoReviewRoute() {
  return (
    <Suspense fallback={<LoadingScreen label="Opening" />}>
      <PhotoReviewPage />
    </Suspense>
  );
}
