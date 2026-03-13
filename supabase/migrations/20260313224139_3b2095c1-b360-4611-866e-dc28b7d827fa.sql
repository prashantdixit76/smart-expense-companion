
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message text NOT NULL,
  sent_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.user_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id uuid REFERENCES public.notifications(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

-- Admins can insert notifications
CREATE POLICY "Admins can insert notifications" ON public.notifications
FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));

-- Admins can view all notifications
CREATE POLICY "Admins can view notifications" ON public.notifications
FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

-- Users can view notifications sent to them
CREATE POLICY "Users can view own notifications" ON public.user_notifications
FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Users can update (mark read) their own notifications
CREATE POLICY "Users can update own notifications" ON public.user_notifications
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Admins can insert user_notifications
CREATE POLICY "Admins can insert user_notifications" ON public.user_notifications
FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));

-- Users can also read notification details
CREATE POLICY "Users can read notifications they received" ON public.notifications
FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.user_notifications WHERE notification_id = notifications.id AND user_id = auth.uid())
);
