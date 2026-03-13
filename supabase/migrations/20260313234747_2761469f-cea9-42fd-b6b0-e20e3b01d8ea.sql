
-- Allow admins to delete system_logs
CREATE POLICY "Admins can delete logs"
ON public.system_logs
FOR DELETE
TO authenticated
USING (is_admin(auth.uid()));

-- Allow admins to delete notifications
CREATE POLICY "Admins can delete notifications"
ON public.notifications
FOR DELETE
TO authenticated
USING (is_admin(auth.uid()));

-- Allow admins to delete user_notifications
CREATE POLICY "Admins can delete user_notifications"
ON public.user_notifications
FOR DELETE
TO authenticated
USING (is_admin(auth.uid()));

-- Allow admins to delete support_tickets
CREATE POLICY "Admins can delete tickets"
ON public.support_tickets
FOR DELETE
TO authenticated
USING (is_admin(auth.uid()));
