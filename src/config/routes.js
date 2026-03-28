const DEFAULT_ROUTES = {
  login: "/Login",
  dashboard: "/Dashboard",
};

function parseRouteMap() {
  const raw = String(process.env.NEXT_PUBLIC_APP_ROUTES || "").trim();

  if (!raw) {
    return DEFAULT_ROUTES;
  }

  try {
    const parsed = JSON.parse(raw);

    return {
      login:
        typeof parsed?.login === "string" && parsed.login.trim()
          ? parsed.login.trim()
          : DEFAULT_ROUTES.login,
      dashboard:
        typeof parsed?.dashboard === "string" && parsed.dashboard.trim()
          ? parsed.dashboard.trim()
          : DEFAULT_ROUTES.dashboard,
    };
  } catch {
    return DEFAULT_ROUTES;
  }
}

export const APP_ROUTES = parseRouteMap();
