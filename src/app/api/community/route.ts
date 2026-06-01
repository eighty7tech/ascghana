import { type NextRequest, NextResponse } from "next/server";
import { getStateValue, setStateValue } from "@/lib/databaseState";

const DEFAULT_CHANNELS = [
  { id:"general",  name:"general",       desc:"Club-wide chat for all members",   icon:"fa-solid fa-hashtag",  createdAt: new Date().toISOString() },
  { id:"matchday", name:"match-day",     desc:"Live match reactions and scores",  icon:"fa-solid fa-futbol",   createdAt: new Date().toISOString() },
  { id:"tickets",  name:"tickets-talk",  desc:"Ticket tips and requests",         icon:"fa-solid fa-ticket",   createdAt: new Date().toISOString() },
  { id:"events",   name:"events",        desc:"Events discussion and planning",   icon:"fa-solid fa-calendar", createdAt: new Date().toISOString() },
  { id:"announce", name:"announcements", desc:"Official club announcements only", icon:"fa-solid fa-bullhorn", createdAt: new Date().toISOString() },
];

export async function GET(req: NextRequest) {
  try {
    const channel = new URL(req.url).searchParams.get("channel");
    const posts = await getStateValue<any[]>("communityPosts", []);
    const channels = await getStateValue("communityChannels", DEFAULT_CHANNELS);

    return NextResponse.json({
      posts: channel ? posts.filter(post => post.channelId === channel) : posts,
      channels,
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Community read failed" }, { status: 503 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const posts = await getStateValue<any[]>("communityPosts", []);
    const post = {
      ...body,
      id: body.id || Date.now(),
      createdAt: body.createdAt || new Date().toISOString(),
    };
    const next = [...posts, post];
    await setStateValue("communityPosts", next);
    return NextResponse.json({ success: true, post });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Community save failed" }, { status: 503 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = Number(new URL(req.url).searchParams.get("id"));
    const posts = await getStateValue<any[]>("communityPosts", []);
    const next = posts.filter(post => Number(post.id) !== id);
    await setStateValue("communityPosts", next);
    return NextResponse.json({ success: true, id });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Community delete failed" }, { status: 503 });
  }
}
