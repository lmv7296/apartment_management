"use client";

import React from "react";

export default function BasicModal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  maxWidthClass = "max-w-xl",
}) {
  React.useEffect(() => {
    if (!isOpen) {
      return;
    }

    function onKeyDown(event) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center p-4'
      role='dialog'
      aria-modal='true'
      onClick={onClose}>
      <div className='absolute inset-0 bg-black/50' />

      <div
        className={`relative w-full ${maxWidthClass} overflow-hidden rounded-2xl border`}
        style={{
          borderColor: "var(--border)",
          backgroundColor: "var(--surface)",
          boxShadow: "var(--shadow)",
        }}
        onClick={(event) => event.stopPropagation()}>
        <div className='border-b p-5' style={{ borderColor: "var(--border)" }}>
          <h3 className='text-xl font-black'>{title}</h3>
          {description ? (
            <p className='mt-1 text-sm app-text-muted'>{description}</p>
          ) : null}
        </div>

        <div className='p-5'>{children}</div>

        {footer ? (
          <div
            className='flex flex-wrap items-center justify-end gap-2 border-t p-4'
            style={{ borderColor: "var(--border)" }}>
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
