// Shrinks a photo in the browser before it is uploaded, so it is quick to
// send on mobile data and small to store.

const MAX_UPLOAD_CHARS = 2_600_000;

async function load(file: File): Promise<{ source: CanvasImageSource; width: number; height: number }> {
  if ("createImageBitmap" in window) {
    try {
      // Respect the phone's orientation tag so portrait photos stay upright.
      const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
      return { source: bitmap, width: bitmap.width, height: bitmap.height };
    } catch {
      // fall through to the <img> route
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.decoding = "async";
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("unreadable image"));
      image.src = url;
    });
    return { source: image, width: image.naturalWidth, height: image.naturalHeight };
  } finally {
    URL.revokeObjectURL(url);
  }
}

function toJpeg(
  picture: { source: CanvasImageSource; width: number; height: number },
  longEdge: number,
  quality: number,
): string {
  const scale = Math.min(1, longEdge / Math.max(picture.width, picture.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(picture.width * scale));
  canvas.height = Math.max(1, Math.round(picture.height * scale));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("no canvas");
  // White behind any transparency, since JPEG has none.
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(picture.source, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", quality);
}

const strip = (dataUrl: string) => dataUrl.replace(/^data:image\/jpeg;base64,/, "");

export interface PreparedPhoto {
  /** JPEG, long edge up to 1568 px, as base64. */
  image: string;
  /** Small JPEG preview as base64. */
  thumb: string;
  /** Data URL for showing the photo on screen straight away. */
  preview: string;
}

export async function preparePhoto(file: File): Promise<PreparedPhoto> {
  const picture = await load(file);
  if (!picture.width || !picture.height) throw new Error("unreadable image");
  let preview = "";
  for (const [edge, quality] of [
    [1568, 0.82],
    [1280, 0.78],
    [1024, 0.72],
  ] as const) {
    preview = toJpeg(picture, edge, quality);
    if (preview.length <= MAX_UPLOAD_CHARS) break;
  }
  return { image: strip(preview), thumb: strip(toJpeg(picture, 480, 0.7)), preview };
}
