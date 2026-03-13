
-- Fix: Replace overly permissive INSERT policy on system_logs
DROP POLICY "Anyone can insert logs" ON public.system_logs;

CREATE POLICY "Authenticated can insert logs" ON public.system_logs
  FOR INSERT TO authenticated
  WITH CHECK (true);
