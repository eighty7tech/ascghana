import { type NextRequest } from "next/server";
import { collectionDeleteById, collectionGetById, collectionPutById } from "@/lib/apiCollection";
type Ctx = { params: Promise<{ id: string }> };
export async function GET(_req: NextRequest, ctx: Ctx) { return collectionGetById("donations", (await ctx.params).id); }
export async function PUT(req: NextRequest, ctx: Ctx) { return collectionPutById(req, "donations", (await ctx.params).id); }
export async function DELETE(_req: NextRequest, ctx: Ctx) { return collectionDeleteById("donations", (await ctx.params).id); }
