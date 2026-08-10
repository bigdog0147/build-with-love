import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  RAISE_EMAIL_EVENTS,
  type RaiseEmailEvent,
  type RaiseEmailVariables,
} from "@/lib/raise-email-scenarios";

export type RaiseEmailPreview = {
  event: RaiseEmailEvent;
  subject: string;
  html: string;
  text: string;
  variables: RaiseEmailVariables;
};

/** Render the "Raise timeline advance" email for one event with sample data. */
export const renderRaiseAdvanceEmailPreview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { event: string }) => {
    if (!RAISE_EMAIL_EVENTS.includes(input.event as RaiseEmailEvent))
      throw new Error("Unknown capital raise event");
    return { event: input.event as RaiseEmailEvent };
  })
  .handler(async ({ data, context }): Promise<RaiseEmailPreview> => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    const React = await import("react");
    const { render } = await import("@react-email/render");
    const { TEMPLATES } = await import("@/lib/email-templates/registry");
    const { raiseEmailTemplateData } = await import("@/lib/raise-email-scenarios");

    const entry = TEMPLATES["raise-timeline-advance"];
    if (!entry) throw new Error("The raise timeline advance template is not registered.");

    const variables = raiseEmailTemplateData(data.event);
    const templateData: Record<string, unknown> = Object.fromEntries(
      Object.entries(variables).filter(([, v]) => v !== "" && v !== undefined),
    );

    const element = React.createElement(entry.component, templateData);
    const html = await render(element);
    const text = await render(element, { plainText: true });
    const subject =
      typeof entry.subject === "function" ? entry.subject(templateData as never) : entry.subject;

    return { event: data.event, subject, html, text, variables };
  });
