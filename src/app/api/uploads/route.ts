import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { type NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

const ALLOWED_FOLDERS = new Set(["logo","members","events","blog","shop","hero","gallery","sponsors","admin"]);
const MAX_BYTES = 10 * 1024 * 1024; // 10MB default; overridden by settings

function safeName(name: string) {
  const ext  = path.extname(name).toLowerCase() || ".png";
  const base = path.basename(name, ext).toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"") || "image";
  return `${base}-${Date.now()}${ext}`;
}

async function getUploadSettings() {
  try {
    const rows = await query<{value:string}>("SELECT `value` FROM app_state WHERE `key`='settings' LIMIT 1",[]);
    if (rows.length) {
      const s = JSON.parse(rows[0].value);
      return {
        provider:      s.uploadProvider       || "local",
        maxBytes:      (s.uploadMaxSizeMb||5)  * 1024 * 1024,
        // Cloudinary
        cloudName:     s.cloudinaryCloudName  || "",
        cloudApiKey:   s.cloudinaryApiKey     || "",
        cloudSecret:   s.cloudinaryApiSecret  || "",
        cloudPreset:   s.cloudinaryUploadPreset|| "",
        cloudFolder:   s.cloudinaryFolder      || "ascghana",
        // S3
        s3Bucket:      s.s3Bucket             || "",
        s3Region:      s.s3Region             || "us-east-1",
        s3Key:         s.s3AccessKey          || "",
        s3Secret:      s.s3SecretKey          || "",
        cdnUrl:        s.cdnUrl               || "",
        // ImgBB
        imgbbKey:      s.imgbbApiKey          || "",
      };
    }
  } catch {}
  return { provider:"local", maxBytes: MAX_BYTES, cloudName:"", cloudApiKey:"", cloudSecret:"", cloudPreset:"", cloudFolder:"ascghana", s3Bucket:"", s3Region:"us-east-1", s3Key:"", s3Secret:"", cdnUrl:"", imgbbKey:"" };
}

/** Upload to Cloudinary via REST API (server-side signed upload) */
async function uploadToCloudinary(bytes: Buffer, filename: string, settings: Awaited<ReturnType<typeof getUploadSettings>>) {
  const crypto = await import("crypto");
  const timestamp = Math.round(Date.now()/1000).toString();
  const folder = settings.cloudFolder;
  const toSign = `folder=${folder}&timestamp=${timestamp}${settings.cloudSecret}`;
  const signature = crypto.createHash("sha256").update(toSign).digest("hex");

  const formData = new FormData();
  const blob = new Blob([new Uint8Array(bytes)]);
  formData.append("file", blob, filename);
  formData.append("api_key", settings.cloudApiKey);
  formData.append("timestamp", timestamp);
  formData.append("signature", signature);
  formData.append("folder", folder);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${settings.cloudName}/image/upload`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error(`Cloudinary error: ${res.status}`);
  const data = await res.json();
  return data.secure_url as string;
}

/** Upload to ImgBB */
async function uploadToImgBB(bytes: Buffer, settings: Awaited<ReturnType<typeof getUploadSettings>>) {
  const base64 = bytes.toString("base64");
  const params = new URLSearchParams({ key: settings.imgbbKey, image: base64 });
  const res = await fetch("https://api.imgbb.com/1/upload", { method:"POST", body:params });
  if (!res.ok) throw new Error(`ImgBB error: ${res.status}`);
  const data = await res.json();
  return data.data.url as string;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file     = formData.get("file");
    const folder   = String(formData.get("folder") || "gallery");

    if (!ALLOWED_FOLDERS.has(folder))    return NextResponse.json({ error:"Invalid folder" },{ status:400 });
    if (!(file instanceof File))         return NextResponse.json({ error:"No file uploaded" },{ status:400 });
    if (!file.type.startsWith("image/")) return NextResponse.json({ error:"Images only" },{ status:400 });

    const settings = await getUploadSettings();

    if (file.size > settings.maxBytes)
      return NextResponse.json({ error:`Image must be under ${settings.maxBytes/1024/1024}MB` },{ status:400 });

    const bytes    = Buffer.from(await file.arrayBuffer());
    const fileName = safeName(file.name);

    // Route to correct provider
    if (settings.provider === "cloudinary" && settings.cloudName && settings.cloudApiKey && settings.cloudSecret) {
      const url = await uploadToCloudinary(bytes, fileName, settings);
      return NextResponse.json({ url });
    }

    if (settings.provider === "imgbb" && settings.imgbbKey) {
      const url = await uploadToImgBB(bytes, settings);
      return NextResponse.json({ url });
    }

    // Default: local filesystem
    const dir = path.join(process.cwd(), "public", "images", folder);
    await mkdir(dir, { recursive:true });
    await writeFile(path.join(dir, fileName), bytes);
    return NextResponse.json({ url:`/images/${folder}/${fileName}` });

  } catch (error) {
    console.error("[uploads]", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Upload failed" },{ status:500 });
  }
}
