CREATE TABLE public.document_notification_deliveries (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id uuid NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'queued',
  inapp_sent boolean NOT NULL DEFAULT false,
  email_sent boolean NOT NULL DEFAULT false,
  reason text,
  error text,
  attempts integer NOT NULL DEFAULT 0,
  idempotency_key text,
  queued_at timestamp with time zone NOT NULL DEFAULT now(),
  sent_at timestamp with time zone,
  failed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX document_notification_deliveries_doc_idx ON public.document_notification_deliveries (document_id, queued_at DESC);
CREATE INDEX document_notification_deliveries_user_idx ON public.document_notification_deliveries (user_id, queued_at DESC);

GRANT ALL ON public.document_notification_deliveries TO service_role;

ALTER TABLE public.document_notification_deliveries ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.set_document_deliveries_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

REVOKE EXECUTE ON FUNCTION public.set_document_deliveries_updated_at() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER document_notification_deliveries_updated_at
BEFORE UPDATE ON public.document_notification_deliveries
FOR EACH ROW EXECUTE FUNCTION public.set_document_deliveries_updated_at();