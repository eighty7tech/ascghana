import { type NextRequest } from "next/server";
import { collectionDelete, collectionGet, collectionPost, collectionPut } from "@/lib/apiCollection";

export async function GET() { return collectionGet("products"); }
export async function POST(req: NextRequest) { return collectionPost(req, "products"); }
export async function PUT(req: NextRequest) { return collectionPut(req, "products"); }
export async function DELETE(req: NextRequest) { return collectionDelete(req, "products"); }
