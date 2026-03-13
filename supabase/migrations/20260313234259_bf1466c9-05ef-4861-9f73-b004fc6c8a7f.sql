
-- Allow authenticated users to also insert public tickets (login page)
CREATE POLICY "Authenticated can insert public tickets"
ON public.support_tickets
FOR INSERT
TO authenticated
WITH CHECK (true);
