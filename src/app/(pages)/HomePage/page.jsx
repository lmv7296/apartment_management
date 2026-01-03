"use client";

import React from "react";

export default function HomePage() {
  const [role, setRole] = React.useState();

  return (
    <main>
      <h1>Home Page</h1>
      <p>Welcome to your apartment management system</p>
    </main>
  );
}
