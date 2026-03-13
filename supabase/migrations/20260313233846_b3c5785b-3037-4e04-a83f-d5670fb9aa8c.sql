
ALTER TABLE public.support_tickets ADD COLUMN source text DEFAULT 'dashboard';

-- Allow anonymous/public inserts for login page tickets (no auth required)
CREATE POLICY "Anyone can insert public tickets"
ON public.support_tickets
FOR INSERT
TO anon
WITH CHECK (true);
