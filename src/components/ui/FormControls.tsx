// src/components/ui/FormControls.tsx
import React from "react";

export const FormGroup = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`mb-4 ${className}`}>{children}</div>
);

export const Label = ({
  children,
  htmlFor,
  className = "",
}: {
  children: React.ReactNode;
  htmlFor?: string;
  className?: string;
}) => (
  <label
    htmlFor={htmlFor}
    className={className ? className : "form-label mb-1 text-[13px]"}
  >
    {children}
  </label>
);

export const Input = ({ className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    className={["input", className].filter(Boolean).join(" ")}
    {...props}
  />
);

export const FormError = ({ children }: { children: React.ReactNode }) => (
  <p className="mt-1 text-[12px] text-red-600">{children}</p>
);
