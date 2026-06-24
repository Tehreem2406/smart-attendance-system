import path from "path";
import { readFile } from "fs/promises";

export async function GET(req, { params }) {
  try {
    const unwrappedParams = await params;
    const base = path.resolve(process.cwd(), "..", "..", "Images");
    const segments = Array.isArray(unwrappedParams.path) ? unwrappedParams.path : [];
    const target = path.resolve(base, ...segments);
    if (!target.startsWith(base)) {
      return new Response("Invalid path", { status: 400 });
    }
    const buf = await readFile(target);
    const ext = path.extname(target).toLowerCase();
    let type = "application/octet-stream";
    if (ext === ".png") type = "image/png";
    else if (ext === ".jpg" || ext === ".jpeg") type = "image/jpeg";
    else if (ext === ".svg") type = "image/svg+xml";
    return new Response(buf, { headers: { "content-type": type } });
  } catch (e) {
    return new Response("Not found", { status: 404 });
  }
}
