"use client";

import React from "react";

export default function BasicModal({
  isOpen,
  onClose,
  eyebrow,
  title,
  description,
  headerAction,
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

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKeyDown);
    };
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
        className={`relative flex max-h-[90vh] w-full ${maxWidthClass} flex-col overflow-hidden rounded-2xl border`}
        style={{
          borderColor: "var(--border)",
          backgroundColor: "var(--surface)",
          boxShadow: "var(--shadow)",
        }}
        onClick={(event) => event.stopPropagation()}>
        <div
          className='shrink-0 border-b p-5'
          style={{ borderColor: "var(--border)" }}>
          <div className='flex items-start justify-between gap-4'>
            <div>
              {eyebrow ? (
                <p className='text-[11px] font-bold uppercase tracking-[0.16em] app-text-muted'>
                  {eyebrow}
                </p>
              ) : null}
              <h3 className='text-xl font-black'>{title}</h3>
              {description ? (
                <p className='mt-1 text-sm app-text-muted'>{description}</p>
              ) : null}
            </div>
            {headerAction ? (
              <div className='shrink-0'>{headerAction}</div>
            ) : null}
          </div>
        </div>

        <div className='flex-1 overflow-y-auto p-5'>{children}</div>

        {footer ? (
          <div
            className='shrink-0 flex flex-wrap items-center justify-end gap-2 border-t p-4'
            style={{ borderColor: "var(--border)" }}>
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
