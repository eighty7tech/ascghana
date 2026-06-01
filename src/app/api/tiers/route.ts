import { type NextRequest } from "next/server";
import { collectionDelete, collectionGet, collectionPost, collectionPut } from "@/lib/apiCollection";

export async function GET() { return collectionGet("tiers"); }
export async function POST(req: NextRequest) { return collectionPost(req, "tiers"); }
export async function PUT(req: NextRequest) { return collectionPut(req, "tiers"); }
export async function DELETE(req: NextRequest) { return collectionDelete(req, "tiers"); }
