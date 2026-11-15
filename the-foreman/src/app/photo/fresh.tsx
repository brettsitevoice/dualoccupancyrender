"use client";

import { useRouter } from "next/navigation";
import { PhotoCheck } from "@/components/photo/PhotoCheck";

/**
 * Opens the photo check with an empty form each time the student navigates
 * here, while keeping what they had if they come back with the browser's
 * back button. (Recent screens are kept alive in the background, so without
 * this the last photo check would still be showing.)
 */
export function FreshPhotoCheck() {
  const { bfcacheId } = useRouter();
  return <PhotoCheck key={bfcacheId} />;
}
