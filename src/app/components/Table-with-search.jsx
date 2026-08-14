"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { getInitials, getAvatarColor, getUnitStatus } from "@/utils/propertyUtils";

export default function TableWithSearch({
  type = "properties", // "properties" | "units" | "custom"
  data = [],
  loading = false,
  searchPlaceholder,
  filterTabs = [],
  activeFilter = "all",
  onFilterChange,
  userAreaUnit = "sq ft",
  openModal,
  columns,
  renderRow,
  emptyMessage,
  itemsPerPage = 10,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Filter items based on search and selected tab filter
  const filteredData = useMemo(() => {
    if (!Array.isArray(data)) return [];

    return data.filter((item) => {
      const q = searchQuery.trim().toLowerCase();

      // Tab filter for units
      if (type === "units" && activeFilter !== "all") {
        const status = getUnitStatus(item);
        if (status !== activeFilter) return false;
      }

      if (!q) return true;

      if (type === "properties") {
        return (
          (item.name || "").toLowerCase().includes(q) ||
          (item.address || "").toLowerCase().includes(q) ||
          (item.city || "").toLowerCase().includes(q) ||
          (item.state || "").toLowerCase().includes(q)
        );
      }

      if (type === "units") {
        return (
          (item.unitCode || item.unit_code || "").toLowerCase().includes(q) ||
          (item.name || "").toLowerCase().includes(q) ||
          (item.email || "").toLowerCase().includes(q)
        );
      }

      // Generic search across item values
      return Object.values(item).some((val) =>
        String(val || "").toLowerCase().includes(q)
      );
    });
  }, [data, searchQuery, type, activeFilter]);

  // Reset to page 1 on search or filter change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeFilter]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedItems = useMemo(() => {
    return filteredData.slice(
      (safePage - 1) * itemsPerPage,
      safePage * itemsPerPage
    );
  }, [filteredData, safePage, itemsPerPage]);

  // Default Column Headers
  const tableHeaders = useMemo(() => {
    if (columns) return columns;
    if (type === "properties") {
      return ["Property", "Location", "Units", "Tenants", "Actions"];
    }
    if (type === "units") {
      return ["Unit Info", "Tenant Details", "Space & Lease", "Status", "Actions"];
    }
    return [];
  }, [columns, type]);

  const defaultSearchPlaceholder =
    searchPlaceholder ||
    (type === "properties"
      ? "Search properties by name, location..."
      : "Search unit number, tenant name...");

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      {/* Top Bar: Search Input & Filter Tabs */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <svg
            className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={defaultSearchPlaceholder}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
          />
        </div>

        {/* Filter Tabs (Optional for units or custom tabs) */}
        {filterTabs && filterTabs.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 rounded-full bg-slate-100 p-1">
            {filterTabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => onFilterChange && onFilterChange(tab.key)}
                className={`cursor-pointer rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                  activeFilter === tab.key
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-transparent text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Table Content */}
      {loading ? (
        <div className="py-12 text-center text-sm text-slate-400">
          Loading data...
        </div>
      ) : filteredData.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-sm font-semibold text-slate-500">
            {emptyMessage || (searchQuery ? "No results match your search." : "No records found.")}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                {tableHeaders.map((col) => (
                  <th
                    key={col}
                    className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedItems.map((item, idx) => {
                if (renderRow) {
                  return renderRow(item, idx);
                }

                // --- Properties Row Renderer ---
                if (type === "properties") {
                  const propertyUnits = Array.isArray(item.units) ? item.units : [];
                  const unitCount = propertyUnits.length;
                  const tenantCount = propertyUnits.filter((u) =>
                    Boolean(u?.assigned_tenant || u?.name)
                  ).length;

                  return (
                    <tr
                      key={item.id || idx}
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-white"
                            style={{
                              background: "linear-gradient(135deg, #2dd4bf, #3b82f6)",
                            }}
                          >
                            <svg className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                              <path
                                fillRule="evenodd"
                                d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2H4a1 1 0 010-2V4zm3 1h2v2H7V5zm4 0h2v2h-2V5zM7 9h2v2H7V9zm4 0h2v2h-2V9z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{item.name}</p>
                            <p className="text-xs text-slate-400">
                              Added{" "}
                              {item.created_at
                                ? new Date(item.created_at).toLocaleDateString("en-US", {
                                    month: "short",
                                    year: "numeric",
                                  })
                                : "—"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-slate-700">{item.address}</p>
                        <p className="text-xs text-slate-400">
                          {item.city}{item.city && item.state ? ", " : ""}{item.state}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-semibold text-slate-900">{unitCount}</p>
                        <p className="text-xs text-slate-400">total units</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-semibold text-slate-900">{tenantCount}</p>
                        <p className="text-xs text-slate-400">active leases</p>
                      </td>
                      <td className="px-4 py-4">
                        <Link
                          href={`/Properties/${item.id}`}
                          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          View Details
                        </Link>
                      </td>
                    </tr>
                  );
                }

                // --- Units Row Renderer ---
                if (type === "units") {
                  const status = getUnitStatus(item);
                  const initials = getInitials(item.name);
                  const avatarColor = getAvatarColor(item.name);

                  return (
                    <tr
                      key={item.id || idx}
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                    >
                      {/* Unit Info */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="h-12 w-12 shrink-0 rounded-lg"
                            style={{
                              background: "linear-gradient(135deg, #2dd4bf, #3b82f6)",
                            }}
                          />
                          <div>
                            <p className="font-bold text-slate-900">
                              {item.unitCode || item.unit_code || "Unit"}
                            </p>
                            <p className="text-xs text-slate-400">
                              {item.bedrooms ?? 0} bed • {item.bathrooms ?? 0} bath
                              {item.squareFeet || item.square_feet
                                ? ` • ${item.squareFeet || item.square_feet} ${userAreaUnit}`
                                : ""}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Tenant Details */}
                      <td className="px-4 py-4">
                        {item.name ? (
                          <div className="flex items-center gap-2.5">
                            <div
                              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                              style={{ backgroundColor: avatarColor }}
                            >
                              {initials}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-800">{item.name}</p>
                              <p className="text-xs text-slate-400">Primary Tenant</p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-500">
                              —
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-400">
                                Not Assigned
                              </p>
                              <p className="text-xs text-slate-400">Ready for Lease</p>
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Space & Lease */}
                      <td className="px-4 py-4">
                        <p className="font-medium text-slate-700">
                          {item.square_feet || item.squareFeet
                            ? `${Number(item.square_feet || item.squareFeet).toLocaleString()} ${userAreaUnit}`
                            : "—"}
                        </p>
                        <p className="text-xs text-slate-400">
                          {item.end_date || item.endDate
                            ? `Ends ${new Date(item.end_date || item.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
                            : status === "occupied"
                            ? "Active lease"
                            : "Available Now"}
                        </p>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4">
                        {status === "occupied" && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700">
                            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                            OCCUPIED
                          </span>
                        )}
                        {status === "vacant" && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-600">
                            <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                            VACANT
                          </span>
                        )}
                        {status === "maintenance" && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-3 py-1 text-xs font-bold text-purple-700">
                            <span className="h-1.5 w-1.5 rounded-full bg-purple-500" />
                            MAINTENANCE
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap items-center gap-2">
                          {item.name ? (
                            <button
                              type="button"
                              onClick={() => openModal && openModal("remove", item)}
                              className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100"
                            >
                              Remove Tenant
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => openModal && openModal("add", item)}
                              className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-100"
                            >
                              Add Tenant
                            </button>
                          )}
                          <Link
                            href={`/Units/${item.id}`}
                            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            View Unit
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                }

                return null;
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Footer */}
      {filteredData.length > itemsPerPage && (
        <div className="mt-4 flex items-center justify-between border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
          <p>
            Showing {(safePage - 1) * itemsPerPage + 1}–
            {Math.min(safePage * itemsPerPage, filteredData.length)} of{" "}
            {filteredData.length} records
          </p>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="rounded-md border border-slate-200 px-2 py-1 font-bold disabled:opacity-40 hover:bg-slate-50"
            >
              ‹
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(
                (n) => n === 1 || n === totalPages || Math.abs(n - safePage) <= 1
              )
              .reduce((acc, n, i, arr) => {
                if (i > 0 && n - arr[i - 1] > 1) acc.push("...");
                acc.push(n);
                return acc;
              }, [])
              .map((item, i) =>
                item === "..." ? (
                  <span key={`ellipsis-${i}`} className="px-1 text-slate-400">
                    …
                  </span>
                ) : (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setCurrentPage(item)}
                    className={`min-w-[28px] cursor-pointer rounded-md border px-2 py-1 text-xs font-semibold transition ${
                      safePage === item
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    {item}
                  </button>
                )
              )}
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="rounded-md border border-slate-200 px-2 py-1 font-bold disabled:opacity-40 hover:bg-slate-50"
            >
              ›
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
