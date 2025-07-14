export enum EmailSecurityEnum {
  NONE = "NONE",
  STARTTLS = "STARTTLS",
  TLS = "TLS",
  SSL = "SSL"
}

export const EMAIL_SECURITY_OPTIONS = [
  {
    value: EmailSecurityEnum.NONE,
    label: "None",
    description: "No encryption (not recommended)"
  },
  {
    value: EmailSecurityEnum.STARTTLS,
    label: "STARTTLS",
    description: "Upgrade to TLS after connection"
  },
  {
    value: EmailSecurityEnum.TLS,
    label: "TLS",
    description: "Transport Layer Security"
  },
  {
    value: EmailSecurityEnum.SSL,
    label: "SSL",
    description: "Secure Sockets Layer"
  }
];
