import { supabase } from '../lib/supabase';

export async function checkSupabaseObject(bucket, path) {
  try {
    const { data, error } = await supabase.storage.from(bucket).download(path);
    if (error) {
      const info = {
        ok: false,
        message: error.message ?? null,
        status: error.status ?? (error?.response?.status) ?? null,
        details: error.details ?? (error?.response?.data ?? null),
        id: error?.id ?? null,
      };
      console.log('Supabase storage error', info);
      return info;
    }

    const props = {
      ok: true,
      size: data?.size ?? null,
      type: data?.type ?? null,
      // createObjectURL is useful for quick preview in devtools
      previewUrl: typeof URL !== 'undefined' && data ? URL.createObjectURL(data) : null,
    };
    console.log('Supabase object properties', props);
    return props;
  } catch (e) {
    console.log('Unexpected error while checking Supabase object', e);
    return { ok: false, error: e };
  }
}

export default checkSupabaseObject;
