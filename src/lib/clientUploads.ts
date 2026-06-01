export type ImageFolder = "logo" | "members" | "events" | "blog" | "shop" | "hero" | "gallery" | "sponsors";

export async function uploadLocalImage(file: File, folder: ImageFolder) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", folder);

  const res = await fetch("/api/uploads", {
    method: "POST",
    body: formData,
  });
  const payload = await res.json().catch(() => ({}));

  if (!res.ok || !payload.url) {
    throw new Error(payload.error || "Image upload failed");
  }

  return payload.url as string;
}
