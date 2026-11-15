import { Suspense } from "react";
import { Game } from "@/components/game/Game";
import { LoadingScreen } from "@/components/ui";

export default function JobPage() {
  return (
    <Suspense fallback={<LoadingScreen label="Opening the job" />}>
      <Game />
    </Suspense>
  );
}
