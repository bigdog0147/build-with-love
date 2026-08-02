import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { requireAdminIdentity, requirePermission, serviceClient } from "./admin-guard.server";

export type ChatMessage = {
  id: string;
  thread_id: string;
  author_role: string;
  author_name: string;
  body: string;
  created_at: string;
};

export type ChatThread = {
  id: string;
  subject: string;
  status: string;
  last_message_at: string;
  unread_for_user: number;
  unread_for_admin: number;
  user_id: string;
  customer?: string;
};

const MAX_BODY = 2000;

function cleanBody(raw: unknown) {
  const body = String(raw ?? "").trim();
  if (!body) throw new Error("Type a message first.");
  if (body.length > MAX_BODY) throw new Error(`Messages are limited to ${MAX_BODY} characters.`);
  return body;
}

/** Customer: the live-chat thread plus its transcript, creating one on demand. */
export const getMyChat = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    let { data: thread } = await supabase
      .from("chat_threads")
      .select("id, subject, status, last_message_at, unread_for_user, unread_for_admin, user_id")
      .eq("user_id", userId)
      .order("last_message_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!thread) {
      const { data: created, error } = await supabase
        .from("chat_threads")
        .insert({ user_id: userId, subject: "Client services" })
        .select("id, subject, status, last_message_at, unread_for_user, unread_for_admin, user_id")
        .maybeSingle();
      if (error) throw new Error(error.message);
      thread = created;
    }
    if (!thread) throw new Error("Could not open a chat thread.");

    const { data: messages } = await supabase
      .from("chat_messages")
      .select("id, thread_id, author_role, author_name, body, created_at")
      .eq("thread_id", thread.id)
      .order("created_at", { ascending: true });

    if ((thread.unread_for_user ?? 0) > 0) {
      await supabase.from("chat_threads").update({ unread_for_user: 0 }).eq("id", thread.id);
    }

    return { thread: thread as ChatThread, messages: (messages ?? []) as ChatMessage[] };
  });

/** Customer: post a message into their own thread. */
export const sendChatMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { threadId: string; body: string }) => input)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const body = cleanBody(data.body);

    const { data: thread } = await supabase
      .from("chat_threads")
      .select("id, unread_for_admin")
      .eq("id", data.threadId)
      .eq("user_id", userId)
      .maybeSingle();
    if (!thread) throw new Error("Chat thread not found.");

    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", userId)
      .maybeSingle();

    const { error } = await supabase.from("chat_messages").insert({
      thread_id: thread.id,
      author_id: userId,
      author_role: "customer",
      author_name: profile?.display_name ?? "Customer",
      body,
    });
    if (error) throw new Error(error.message);

    await supabase
      .from("chat_threads")
      .update({
        last_message_at: new Date().toISOString(),
        status: "open",
        unread_for_admin: (thread.unread_for_admin ?? 0) + 1,
      })
      .eq("id", thread.id);

    return { ok: true as const };
  });

/** Admin: every chat thread, newest activity first. */
export const getChatThreads = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const identity = await requireAdminIdentity(context as never);
    requirePermission(identity, "notifications");
    const db = await serviceClient();

    const { data: threads } = await db
      .from("chat_threads")
      .select("id, subject, status, last_message_at, unread_for_user, unread_for_admin, user_id")
      .order("last_message_at", { ascending: false })
      .limit(100);

    const ids = [...new Set(((threads ?? []) as ChatThread[]).map((t) => t.user_id))];
    const { data: profiles } = ids.length
      ? await db.from("profiles").select("id, display_name").in("id", ids)
      : { data: [] as any[] };
    const nameById = new Map((profiles ?? []).map((p: any) => [p.id, p.display_name]));

    return {
      threads: ((threads ?? []) as ChatThread[]).map((t) => ({
        ...t,
        customer: nameById.get(t.user_id) ?? "Customer",
      })),
    };
  });

/** Admin: transcript for one thread, marking it read for staff. */
export const getChatThread = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { threadId: string }) => input)
  .handler(async ({ data, context }) => {
    const identity = await requireAdminIdentity(context as never);
    requirePermission(identity, "notifications");
    const db = await serviceClient();

    const { data: messages } = await db
      .from("chat_messages")
      .select("id, thread_id, author_role, author_name, body, created_at")
      .eq("thread_id", data.threadId)
      .order("created_at", { ascending: true });

    await db.from("chat_threads").update({ unread_for_admin: 0 }).eq("id", data.threadId);
    return { messages: (messages ?? []) as ChatMessage[] };
  });

/** Admin: reply to a customer thread. */
export const replyToChat = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { threadId: string; body: string; close?: boolean }) => input)
  .handler(async ({ data, context }) => {
    const identity = await requireAdminIdentity(context as never);
    requirePermission(identity, "notifications");
    const db = await serviceClient();
    const body = cleanBody(data.body);

    const { data: thread } = await db
      .from("chat_threads")
      .select("id, user_id, unread_for_user")
      .eq("id", data.threadId)
      .maybeSingle();
    if (!thread) throw new Error("Chat thread not found.");

    const { error } = await db.from("chat_messages").insert({
      thread_id: thread.id,
      author_id: identity.userId,
      author_role: "admin",
      author_name: identity.fullName,
      body,
    });
    if (error) throw new Error(error.message);

    await db
      .from("chat_threads")
      .update({
        last_message_at: new Date().toISOString(),
        status: data.close ? "closed" : "open",
        assigned_to: identity.userId,
        unread_for_user: (thread.unread_for_user ?? 0) + 1,
      })
      .eq("id", thread.id);

    return { ok: true as const, message: data.close ? "Replied and closed." : "Reply sent." };
  });
