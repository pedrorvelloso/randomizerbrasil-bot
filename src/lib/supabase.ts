import { createClient } from '@supabase/supabase-js';
import { Runner, RunnerInsert } from '../types/database';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export async function getRunnerByStreamName(streamName: string): Promise<Runner | null> {
  const { data, error } = await supabase
    .from('runners')
    .select('*')
    .ilike('stream_name', streamName)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  return data as Runner | null;
}

export async function getRunnerBySourceId(sourceId: string): Promise<Runner | null> {
  const { data, error } = await supabase
    .from('runners')
    .select('*')
    .eq('source_id', sourceId)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  return data as Runner | null;
}

export async function createRunner(runner: RunnerInsert): Promise<Runner> {
  const { data, error } = await supabase
    .from('runners')
    .insert(runner)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as Runner;
}

export async function updateRunner(
  id: string,
  updates: Partial<RunnerInsert>
): Promise<Runner> {
  const { data, error } = await supabase
    .from('runners')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as Runner;
}

export async function deleteRunnerByStreamName(streamName: string): Promise<boolean> {
  const { error, count } = await supabase
    .from('runners')
    .delete({ count: 'exact' })
    .ilike('stream_name', streamName);

  if (error) {
    throw error;
  }

  return (count ?? 0) > 0;
}

export async function deleteRunnerBySourceId(sourceId: string): Promise<boolean> {
  const { error, count } = await supabase
    .from('runners')
    .delete({ count: 'exact' })
    .eq('source_id', sourceId);

  if (error) {
    throw error;
  }

  return (count ?? 0) > 0;
}

export async function getAllRunners(): Promise<Runner[]> {
  const { data, error } = await supabase
    .from('runners')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data as Runner[]) ?? [];
}
