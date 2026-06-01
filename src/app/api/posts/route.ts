import { type NextRequest } from "next/server";
import { collectionDelete, collectionGet, collectionPost, collectionPut } from "@/lib/apiCollection";

export async function GET() { return collectionGet("posts"); }
export async function POST(req: NextRequest) { return collectionPost(req, "posts"); }
export async function PUT(req: NextRequest) { return collectionPut(req, "posts"); }
export async function DELETE(req: NextRequest) { return collectionDelete(req, "posts"); }
