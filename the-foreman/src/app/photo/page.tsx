import { Suspense } from "react";
import { LoadingScreen } from "@/components/ui";
import { FreshPhotoCheck } from "./fresh";

export default function PhotoPage() {
  return (
    <Suspense fallback={<LoadingScreen label="Opening" />}>
      <FreshPhotoCheck />
    </Suspense>
  );
}
