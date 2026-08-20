/**
 * propertyUtils.js
 * Utility helper functions for property and unit normalization, status calculation, and avatar formatting.
 */

/**
 * Normalizes raw unit object fields into consistent properties.
 */
export function normalizeUnit(unitData) {
  if (!unitData || typeof unitData !== "object") return null;

  const tenantName =
    unitData.tenantName ||
    unitData.name ||
    unitData.tenant_name ||
    unitData.assignedTenantName ||
    unitData.assigned_tenant_name ||
    null;

  const tenantEmail = unitData.tenantEmail || unitData.email || unitData.tenant_email || null;
  const tenantPhone = unitData.tenantPhone || unitData.phone || unitData.tenant_phone || null;
  const leaveDate = unitData.leaveDate || unitData.leave_date || null;
  const leaseStartDate = unitData.leaseStartDate || unitData.start_date || null;
  const leaseEndDate = unitData.leaseEndDate || unitData.end_date || null;
  const monthlyRent = unitData.monthlyRent ?? (unitData.monthly_rent != null ? Number(unitData.monthly_rent) : null);
  const squareFeet = unitData.squareFeet ?? unitData.square_feet ?? null;
  const unitCode = unitData.unitCode || unitData.unit_code || unitData.code || "Unit";
  const propertyId = unitData.propertyId || unitData.property_id || null;

  return {
    ...unitData,
    id: unitData.id,
    unitCode,
    unit_code: unitCode,
    propertyId,
    property_id: propertyId,
    bedrooms: unitData.bedrooms ?? unitData.bedroom_count ?? 0,
    bathrooms: unitData.bathrooms ?? unitData.bathroom_count ?? 1,
    squareFeet,
    square_feet: squareFeet,
    monthlyRent,
    monthly_rent: monthlyRent,
    tenantName,
    tenantEmail,
    tenantPhone,
    name: tenantName,
    leaveDate,
    leave_date: leaveDate,
    leaseStartDate,
    leaseEndDate,
  };
}

/**
 * Calculates the operational status of a unit ("occupied", "vacant", "maintenance").
 */
export function getUnitStatus(unit) {
  if (!unit) return "vacant";
  if (unit.status === "maintenance" || unit.leaseStatus === "maintenance") return "maintenance";
  if (unit.name || unit.assigned_tenant || unit.tenantName) {
    if (unit.leaveDate || unit.leave_date) return "maintenance";
    return "occupied";
  }
  return "vacant";
}

/**
 * Generates initials string (e.g. "John Doe" -> "JD").
 */
export function getInitials(name) {
  if (!name) return "?";
  const parts = String(name).trim().split(/\s+/);
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();
}

/**
 * Generates a consistent hex color string based on name hash.
 */
export function getAvatarColor(name) {
  const AVATAR_COLORS = [
    "#1d4ed8",
    "#7c3aed",
    "#059669",
    "#b45309",
    "#dc2626",
    "#06b6d4",
    "#3b82f6",
    "#ec4899",
  ];
  if (!name) return "#94a3b8";
  let hash = 0;
  const str = String(name);
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}
