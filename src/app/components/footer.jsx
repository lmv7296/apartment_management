"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import LogoMark from "./logo-mark";

export default function Footer() {
  return (
    <footer
      className='sticky flex shrink-0 items-center justify-between gap-4 border-b bg-white px-6 py-3 lg:ml-[210px] lg:w-[calc(100%-210px)]'
      style={{ borderColor: "var(--border)", backgroundColor: "var(--bg)" }}>
      <div className=' flex flex-col gap-4 px-4 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8'>
        <div className='flex items-center gap-3'>
          <LogoMark size='sm' />
          <div>
            <p
              className='text-sm font-semibold'
              style={{ color: "var(--text)" }}>
              Apartment Manager
            </p>
            <p className='text-xs app-text-muted'>
              © {new Date().getFullYear()} Apartment Management
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
