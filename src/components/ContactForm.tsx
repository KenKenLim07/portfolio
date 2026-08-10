"use client";

import { FormEvent, useState } from "react";
import emailjs from "@emailjs/browser";
import { Loader2 } from "lucide-react";
import { FloatingField } from "@/components/ui/FloatingField";
import { validateContactForm } from "@/lib/validation";
import { cn } from "@/lib/utils";

const SERVICE_ID =
  process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || "service_3gnzubf";
const TEMPLATE_ID =
  process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID || "template_8xpd072";
const PUBLIC_KEY =
  process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || "ThYLaaQPCUATIOrgE";

const INITIAL = {
  from_name: "",
  from_email: "",
  message: "",
};

type Status = "idle" | "success" | "error";

export function ContactForm() {
  const [values, setValues] = useState(INITIAL);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setField = (field: keyof typeof INITIAL, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    if (status !== "idle") setStatus("idle");
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitAttempted(true);

    const validationErrors = validateContactForm(values);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setStatus("error");
      setStatusMessage("Please complete all fields before sending.");
      return;
    }

    setErrors({});
    setIsSubmitting(true);
    setStatus("idle");
    setStatusMessage("");

    try {
      await emailjs.sendForm(
        SERVICE_ID,
        TEMPLATE_ID,
        e.currentTarget,
        PUBLIC_KEY,
      );
      setStatus("success");
      setStatusMessage("Message sent. I'll get back to you soon.");
      setValues(INITIAL);
      setErrors({});
      setSubmitAttempted(false);
      e.currentTarget.reset();
    } catch {
      setStatus("error");
      setStatusMessage(
        "Something went wrong. Please try again or email directly.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const showError = (field: keyof typeof INITIAL) =>
    submitAttempted ? errors[field] : undefined;

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full space-y-5 text-left"
      noValidate
    >
      <FloatingField
        name="from_name"
        label="Name"
        required
        autoComplete="name"
        value={values.from_name}
        onChange={(v) => setField("from_name", v)}
        error={showError("from_name")}
      />

      <FloatingField
        name="from_email"
        label="Email"
        type="email"
        required
        autoComplete="email"
        value={values.from_email}
        onChange={(v) => setField("from_email", v)}
        error={showError("from_email")}
      />

      <FloatingField
        name="message"
        label="Message"
        multiline
        required
        rows={5}
        value={values.message}
        onChange={(v) => setField("message", v)}
        error={showError("message")}
      />

      {statusMessage && (
        <p
          role="status"
          className={cn(
            "radius-control border px-4 py-3 text-sm",
            status === "success" &&
              "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
            status === "error" &&
              "border-red-500/30 bg-red-500/10 text-red-300",
          )}
        >
          {statusMessage}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="radius-control inline-flex w-full cursor-pointer items-center justify-center gap-2 border border-[color:var(--cta-border)] bg-[var(--cta-bg)] px-6 py-3.5 text-sm font-medium uppercase tracking-[0.08em] text-[var(--cta-fg)] transition-colors duration-200 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground/30"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Sending…
          </>
        ) : (
          "Send Message"
        )}
      </button>
    </form>
  );
}
