import { type NextRequest } from "next/server";
import { collectionDelete, collectionGet, collectionPost, collectionPut } from "@/lib/apiCollection";

export async function GET() { return collectionGet("events"); }
export async function POST(req: NextRequest) { return collectionPost(req, "events"); }
export async function PUT(req: NextRequest) { return collectionPut(req, "events"); }
export async function DELETE(req: NextRequest) { return collectionDelete(req, "events"); }
