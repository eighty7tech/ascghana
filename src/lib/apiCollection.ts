import { type NextRequest, NextResponse } from "next/server";
import { getStateValue, setStateValue } from "@/lib/databaseState";

type Id = string | number;

function nextId(items: Array<{ id: Id }>) {
  const numeric = items.map(item => Number(item.id)).filter(Number.isFinite);
  return numeric.length ? Math.max(...numeric) + 1 : Date.now();
}

export async function collectionGet<T>(key: string, fallback: T[] = []) {
  try {
    return NextResponse.json(await getStateValue<T[]>(key, fallback));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : `${key} read failed` }, { status: 503 });
  }
}

export async function collectionPost<T extends { id: Id }>(req: NextRequest, key: string) {
  try {
    const body = await req.json();
    const items = await getStateValue<T[]>(key, []);
    const item = { ...body, id: body.id ?? nextId(items) } as T;
    const next = [item, ...items];
    await setStateValue(key, next);
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : `${key} save failed` }, { status: 503 });
  }
}

export async function collectionPut<T extends { id: Id }>(req: NextRequest, key: string) {
  try {
    const body = await req.json();
    if (body.id === undefined || body.id === null) return NextResponse.json({ error: "id is required" }, { status: 400 });
    const items = await getStateValue<T[]>(key, []);
    const next = items.map(item => String(item.id) === String(body.id) ? { ...item, ...body } : item);
    await setStateValue(key, next);
    return NextResponse.json(next.find(item => String(item.id) === String(body.id)) || body);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : `${key} update failed` }, { status: 503 });
  }
}

export async function collectionDelete<T extends { id: Id }>(req: NextRequest, key: string) {
  try {
    const id = new URL(req.url).searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });
    const items = await getStateValue<T[]>(key, []);
    const next = items.filter(item => String(item.id) !== id);
    await setStateValue(key, next);
    return NextResponse.json({ success: true, id });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : `${key} delete failed` }, { status: 503 });
  }
}

export async function collectionGetById<T extends { id: Id }>(key: string, id: string) {
  try {
    const items = await getStateValue<T[]>(key, []);
    const item = items.find(row => String(row.id) === id);
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(item);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : `${key} read failed` }, { status: 503 });
  }
}

export async function collectionPutById<T extends { id: Id }>(req: NextRequest, key: string, id: string) {
  try {
    const body = await req.json();
    const items = await getStateValue<T[]>(key, []);
    const next = items.map(item => String(item.id) === id ? { ...item, ...body, id: item.id } : item);
    await setStateValue(key, next);
    return NextResponse.json(next.find(item => String(item.id) === id) || { id, ...body });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : `${key} update failed` }, { status: 503 });
  }
}

export async function collectionDeleteById<T extends { id: Id }>(key: string, id: string) {
  try {
    const items = await getStateValue<T[]>(key, []);
    await setStateValue(key, items.filter(item => String(item.id) !== id));
    return NextResponse.json({ success: true, id });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : `${key} delete failed` }, { status: 503 });
  }
}
