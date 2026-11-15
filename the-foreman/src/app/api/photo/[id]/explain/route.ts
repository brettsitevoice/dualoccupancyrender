import { aiEnabled, lookAtPhoto } from "@/lib/ai/foreman";
import { photoFeedbackPrompt, photoObservationPrompt } from "@/lib/ai/prompts";
import { checkOrigin, HttpError, readJson, requireUser, route, str } from "@/lib/server/http";
import { photoView } from "@/lib/server/jobs";
import { allow, LIMITS } from "@/lib/server/rate-limit";
import { getPhoto, updatePhoto } from "@/lib/server/store";
import { deltaSender, eventStream } from "@/lib/server/stream";

export const maxDuration = 120;

/**
 * Step 2 of a photo check: the student explains their reasoning, then the
 * foreman gives his feedback. If step 1 never finished (for example the
 * connection dropped), calling this with no reasoning runs the first look again.
 */
export const POST = route(async (request: Request, ctx: RouteContext<"/api/photo/[id]/explain">) => {
  checkOrigin(request);
  const user = await requireUser();
  const { id } = await ctx.params;
  const body = await readJson(request);
  const photo = await getPhoto(id, user.id);
  if (!photo) throw new HttpError(404, "Couldn't find that photo check.");
  if (photo.status === "complete") throw new HttpError(409, "This photo check is already finished.");
  if (!aiEnabled()) {
    throw new HttpError(503, "Photo checks need the AI foreman, and he isn't connected right now.", "ai_off");
  }
  if (!allow(`ai:${user.id}`, LIMITS.ai)) {
    throw new HttpError(429, "Give the foreman a minute to catch up, then try again.");
  }

  // Retry of the first look.
  if (!photo.observations) {
    return eventStream(request, async (send, signal) => {
      const result = await lookAtPhoto({
        prompt: photoObservationPrompt({ task: photo.task, note: photo.note }),
        image: photo.image,
        signal,
        onText: deltaSender(send),
      });
      if (!result.ok) {
        if (result.reason !== "aborted") {
          send({ t: "error", message: "The foreman couldn't look at that photo. Try again in a moment." });
        }
        return;
      }
      await updatePhoto(photo.id, user.id, { observations: result.text, ai: true });
      send({ t: "photo", review: photoView({ ...photo, observations: result.text, ai: true }, true) });
      send({ t: "done", ai: true });
    });
  }

  const reasoning = str(body.reasoning, 900);
  if (reasoning.length < 10) throw new HttpError(400, "Tell the foreman a bit more about how you did it.");

  return eventStream(request, async (send, signal) => {
    const result = await lookAtPhoto({
      prompt: photoFeedbackPrompt({
        task: photo.task,
        note: photo.note,
        observations: photo.observations,
        reasoning,
      }),
      image: photo.image,
      signal,
      onText: deltaSender(send),
    });
    if (!result.ok) {
      if (result.reason !== "aborted") {
        send({ t: "error", message: "The foreman couldn't be reached. Try again in a moment." });
      }
      return;
    }
    await updatePhoto(photo.id, user.id, { reasoning, feedback: result.text, status: "complete", ai: true });
    send({
      t: "photo",
      review: photoView({ ...photo, reasoning, feedback: result.text, status: "complete", ai: true }, true),
    });
    send({ t: "done", ai: true });
  });
});
