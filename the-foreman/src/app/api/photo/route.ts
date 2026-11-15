import { aiEnabled, lookAtPhoto } from "@/lib/ai/foreman";
import { photoObservationPrompt } from "@/lib/ai/prompts";
import { checkOrigin, HttpError, json, readJson, requireUser, route, str } from "@/lib/server/http";
import { photoView } from "@/lib/server/jobs";
import { allow, LIMITS } from "@/lib/server/rate-limit";
import { createPhoto, getJob, listPhotos, updatePhoto } from "@/lib/server/store";
import { deltaSender, eventStream } from "@/lib/server/stream";

export const maxDuration = 120;

const MAX_IMAGE_CHARS = 2_800_000; // about 2 MB of JPEG once decoded
const MAX_THUMB_CHARS = 200_000;
const BASE64 = /^[A-Za-z0-9+/]+={0,2}$/;

/** Accepts a JPEG as base64, with or without a data: prefix. */
function jpegBase64(value: unknown, maxChars: number): string | null {
  if (typeof value !== "string") return null;
  const data = value.replace(/^data:image\/jpeg;base64,/, "");
  // "/9j/" is how every JPEG starts once base64 encoded.
  if (data.length < 100 || data.length > maxChars || !data.startsWith("/9j/") || !BASE64.test(data)) return null;
  return data;
}

/** The signed-in student's photo checks, newest first (small previews only). */
export const GET = route(async () => {
  const user = await requireUser();
  const photos = await listPhotos(user.id);
  return json({ photos: photos.map((photo) => photoView(photo, false)), aiEnabled: aiEnabled() });
});

/**
 * Step 1 of a photo check: the student sends a photo of their practical work.
 * The foreman says what he can see and asks them to explain their reasoning.
 */
export const POST = route(async (request: Request) => {
  checkOrigin(request);
  const user = await requireUser();
  const body = await readJson(request, MAX_IMAGE_CHARS + MAX_THUMB_CHARS + 4_000);

  const image = jpegBase64(body.image, MAX_IMAGE_CHARS);
  const thumb = jpegBase64(body.thumb, MAX_THUMB_CHARS);
  const task = str(body.task, 80);
  const note = str(body.note, 300);
  if (!image || !thumb) throw new HttpError(400, "That photo couldn't be read. Try taking it again.");
  if (!task) throw new HttpError(400, "Say what the work is, for example a wall frame.");
  if (!aiEnabled()) {
    throw new HttpError(503, "Photo checks need the AI foreman, and he isn't connected right now.", "ai_off");
  }
  if (!allow(`photo:${user.id}`, LIMITS.photo)) {
    throw new HttpError(429, "That's a lot of photos. Give it a few minutes and try again.");
  }

  const requestedJob = str(body.jobId, 40);
  const job = requestedJob ? await getJob(requestedJob, user.id) : null;
  const review = await createPhoto({ userId: user.id, jobId: job?.id ?? null, task, note, image, thumb });

  return eventStream(request, async (send, signal) => {
    send({ t: "photo", review: photoView(review, true) });
    const result = await lookAtPhoto({
      prompt: photoObservationPrompt({ task, note }),
      image,
      signal,
      onText: deltaSender(send),
    });
    if (!result.ok) {
      if (result.reason !== "aborted") {
        send({ t: "error", message: "The foreman couldn't look at that photo. Try again in a moment." });
      }
      return;
    }
    await updatePhoto(review.id, user.id, { observations: result.text, ai: true });
    send({ t: "photo", review: photoView({ ...review, observations: result.text, ai: true }, true) });
    send({ t: "done", ai: true });
  });
});
