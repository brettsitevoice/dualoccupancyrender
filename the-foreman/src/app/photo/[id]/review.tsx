"use client";

import { useParams } from "next/navigation";
import { PhotoCheck } from "@/components/photo/PhotoCheck";

export function PhotoReviewPage() {
  const { id } = useParams<{ id: string }>();
  return <PhotoCheck key={id} reviewId={id} />;
}
