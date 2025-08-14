'use server';

import { auth } from "@clerk/nextjs/server";
import { createSupabaseClient } from "../supabase";
import { revalidatePath } from "next/cache";

export const createCompanion = async (formData: CreateCompanion) => {
    const { userId: author } = await auth();
    const supabase = createSupabaseClient();

    const { data, error } = await supabase
        .from('Companions')
        .insert({... formData, author })
        .select();

    if(error || !data) throw new Error(error?.message || 'Failed to create a Companion');

    return data[0]
}

export const getAllCompanions = async ({ limit = 10, page = 1, subject, topic}: GetAllCompanions) => {
    const supabase = createSupabaseClient();

    let query = supabase.from('Companions').select();

    if(subject && topic) {
        query = query.ilike( 'subject', `%${subject}%` )
            .or( `topic.ilike.%${topic}%, name.ilike.%${topic}%` )
    } else if(subject) {
        query = query.ilike( 'subject', `%${subject}%` )
    } else if(topic) {
        query = query.or( `topic.ilike.%${topic}%, name.ilike.%${topic}%` )
    }

    query = query.range((page-1) * limit, page*limit-1)

    const { data: Companions, error } = await query;

    if(error) throw new Error(error.message);

    return Companions;
}

export const getCompanionsWithBookmarks = async ({ limit = 10, page = 1, subject, topic}: GetAllCompanions) => {
    const { userId } = await auth();
    const supabase = createSupabaseClient();

    let query = supabase
        .from('Companions')
        .select(`
            *,
            bookmarks!left(id)
        `)
        .eq('bookmarks.user_id', userId || '');

    if(subject && topic) {
        query = query.ilike( 'subject', `%${subject}%` )
            .or( `topic.ilike.%${topic}%, name.ilike.%${topic}%` )
    } else if(subject) {
        query = query.ilike( 'subject', `%${subject}%` )
    } else if(topic) {
        query = query.or( `topic.ilike.%${topic}%, name.ilike.%${topic}%` )
    }

    query = query.range((page-1) * limit, page*limit-1)

    const { data: Companions, error } = await query;

    if(error) throw new Error(error.message);

    return Companions.map(companion => ({
        ...companion,
        bookmarked: companion.bookmarks && companion.bookmarks.length > 0,
        bookmarks: undefined
    }));
}

export const getCompanion = async (id: string) => {
    const supabase = createSupabaseClient();

    const { data, error } = await supabase.from('Companions')
        .select()
        .eq('id', id);

    if(error) return console.log(error);

    return data[0]
}

export const addToSessionHistory = async (companionId: string) => {
    const {userId} = await auth();
    const supabase = createSupabaseClient();
    const { data, error } = await supabase.from('session_history').insert({
        companion_id: companionId,
        user_id: userId
    })

    if(error) throw new Error(error.message);

    return data
}

interface SessionRow {
  companions: Companion;
}

export const getRecentSessions = async (limit = 10) => {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from("session_history")
    .select(`companions:companion_id (*)`)
    .order("created_at", { ascending: false })
    .limit(limit)
    .returns<SessionRow[]>();

  if (error) throw new Error(error.message);

  const seen = new Set<string>();
  const uniqueCompanions: Companion[] = [];

  for (const { companions } of data) {
    if (companions && !seen.has(companions.id)) {
      seen.add(companions.id);
      uniqueCompanions.push(companions);
    }
  }

  return uniqueCompanions;
};

export const getUserSessions = async (userId: string, limit = 10) => {
    const supabase = createSupabaseClient();
    const { data, error } = await supabase
        .from('session_history')
        .select(`companions:companion_id (*)`)
        .eq('user_id', userId)
        .order('created_at', { ascending: false})
        .limit(limit)
        .returns<SessionRow[]>();
    
        if(error) throw new Error(error.message);

        const seen = new Set<string>();
        const uniqueCompanions: Companion[] = [];

        for (const { companions } of data) {
            if (companions && !seen.has(companions.id)) {
            seen.add(companions.id);
            uniqueCompanions.push(companions);
            }
        }

        return uniqueCompanions;
}

export const getUserCompanions = async (userId: string) => {
    const supabase = createSupabaseClient();
    const { data, error } = await supabase
        .from('Companions')
        .select()
        .eq('author', userId)

    if(error) throw new Error(error.message);

    return data;
}

export const newCompanionPermissions = async () => {
    const { userId, has } = await auth();
    const supabase = createSupabaseClient();

    let limit = 0

    if(has({ plan: 'pro' })) {
        return true;
    } else if(has({ feature: "3_companion_limit" })) {
        limit = 3;
    } else if(has({ feature: "10_companion_limit" })) {
        limit = 10;
    }

    const { data, error } = await supabase
    .from('Companions')
    .select('id', {count: 'exact'})
    .eq('author', userId)

    if(error) throw new Error(error.message)
    
    const companionCount = data?.length

    if(companionCount >= limit) {
        return false;
    } else {
        return true;
    }
}

export const addBookmark = async (companionId: string, path: string) => {
  const { userId } = await auth();
  if (!userId) throw new Error("User not authenticated");

  const supabase = createSupabaseClient();
  
  const { data: existing } = await supabase
    .from("bookmarks")
    .select("id")
    .eq("companion_id", companionId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) {
    revalidatePath('/home');
    revalidatePath(path);
    return existing;
  }

  const { data, error } = await supabase.from("bookmarks").insert({
    companion_id: companionId,
    user_id: userId,
  });

  if (error) throw new Error(error.message);

  revalidatePath('/home');
  revalidatePath(path);
  return data;
};

export const removeBookmark = async (companionId: string, path: string) => {
  const { userId } = await auth();
  if (!userId) throw new Error("User not authenticated");

  const supabase = createSupabaseClient();
  
  const { data, error } = await supabase
    .from("bookmarks")
    .delete()
    .eq("companion_id", companionId)
    .eq("user_id", userId);

  if (error) throw new Error(error.message);

  revalidatePath('/home');
  revalidatePath(path);
  return data;
};

export const getBookmarkedCompanions = async (userId: string) => {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from("bookmarks")
    .select(`companions:companion_id (*)`) 
    .eq("user_id", userId);
  if (error) {
    throw new Error(error.message);
  }
  return data.map(({ companions }) => companions);
};