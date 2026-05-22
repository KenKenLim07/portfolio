const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email.trim());
}

export function validateContactForm(values: {
  from_name: string;
  from_email: string;
  message: string;
}): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!values.from_name.trim()) {
    errors.from_name = "Name is required.";
  }

  if (!values.from_email.trim()) {
    errors.from_email = "Email is required.";
  } else if (!isValidEmail(values.from_email)) {
    errors.from_email = "Enter a valid email address.";
  }

  if (!values.message.trim()) {
    errors.message = "Message is required.";
  }

  return errors;
}
