import { type NextRequest } from "next/server";
import { collectionDeleteById, collectionGetById, collectionPutById } from "@/lib/apiCollection";
type Ctx = { params: Promise<{ id: string }> };
export async function GET(_req: NextRequest, ctx: Ctx) { return collectionGetById("posts", (await ctx.params).id); }
export async function PUT(req: NextRequest, ctx: Ctx) { return collectionPutById(req, "posts", (await ctx.params).id); }
export async function DELETE(_req: NextRequest, ctx: Ctx) { return collectionDeleteById("posts", (await ctx.params).id); }
