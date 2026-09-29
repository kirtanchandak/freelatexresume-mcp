import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { encrypt, decrypt } from "@/lib/crypto";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("api_keys")
    .select("id, provider, base_url, created_at")
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ keys: data });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { provider, apiKey, baseUrl } = await req.json();
  
  if (!provider || !apiKey) {
    return NextResponse.json({ error: "provider and apiKey are required" }, { status: 400 });
  }

  const encryptedKey = await encrypt(apiKey);

  const { error } = await supabase
    .from("api_keys")
    .upsert(
      {
        user_id: user.id,
        provider,
        encrypted_key: encryptedKey,
        base_url: baseUrl || null,
      },
      { onConflict: "user_id,provider" }
    );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { provider } = await req.json();
  
  if (!provider) {
    return NextResponse.json({ error: "provider is required" }, { status: 400 });
  }

  const { error } = await supabase
    .from("api_keys")
    .delete()
    .eq("user_id", user.id)
    .eq("provider", provider);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
