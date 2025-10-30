"use client";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function useStorageUpload(bucket) {
  const supabase = createClientComponentClient();

  const uploadFile = async (file, path) => {
    const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });
    if (error) throw error;
    return data;
  };

  return { uploadFile };
}
