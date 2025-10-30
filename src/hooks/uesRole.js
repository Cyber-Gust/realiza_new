"use client";
import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function useRole() {
  const supabase = createClientComponentClient();
  const [role, setRole] = useState(null);

  useEffect(() => {
    const fetchRole = async () => {
      const { data, error } = await supabase.rpc("get_my_role");
      if (!error) setRole(data);
    };
    fetchRole();
  }, []);

  return role;
}
