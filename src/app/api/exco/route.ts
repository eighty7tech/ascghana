import { type NextRequest } from "next/server";
import { collectionDelete, collectionGet, collectionPost, collectionPut } from "@/lib/apiCollection";

export async function GET() { return collectionGet("exco"); }
export async function POST(req: NextRequest) { return collectionPost(req, "exco"); }
export async function PUT(req: NextRequest) { return collectionPut(req, "exco"); }
export async function DELETE(req: NextRequest) { return collectionDelete(req, "exco"); }
