// src/hooks/useAuth.js
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Returns { session, loading }.
 * session === null  → not logged in
 * session === obj   → logged in
 * loading === true  → initial session check in progress
 */
export function useAuth() {
  const [session, setSession] = useState(undefined); // undefined = not yet checked
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get the current session once on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for sign-in / sign-out events
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return { session, loading };
}