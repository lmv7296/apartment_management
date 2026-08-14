"use client";

import React from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "@/app/providers";
import { APP_ROUTES } from "@/config/routes";
import userPreferences from "@/config/user-preferences.json";
import PropertyModalsContainer from "@/app/components/modals/PropertyModalsContainer";
import TableWithSearch from "@/app/components/Table-with-search";
import { exportToCSV } from "@/app/components/exportToCSV";
import KpiCard from "@/app/components/KpiCard";
import { normalizeUnit, getUnitStatus, getInitials, getAvatarColor } from "@/utils/propertyUtils";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";

export default function PropertyDetailsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();

  const settingsLoadedRef = React.useRef(false);
  const [property, setProperty] = React.useState(null);
  const [units, setUnits] = React.useState([]);
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [modalMode, setModalMode] = React.useState("");
  const [activeUnit, setActiveUnit] = React.useState(null);
  const [actionMessage, setActionMessage] = React.useState("");

  const [userCurrency, setUserCurrency] = React.useState(
    userPreferences.defaultSettings.currency,
  );
  const [userAreaUnit, setUserAreaUnit] = React.useState("sq ft");
  const [formData, setFormData] = React.useState({
    add: {
      fullName: "",
      email: "",
      phone: "",
      startDate: "",
      endDate: "",
      monthlyRent: "",
      currency: userPreferences.defaultSettings.currency,
      notes: "",
    },
    remove: {
      leaveDate: "",
      forwardingAddress: "",
      reason: "",
      depositReturnAmount: "",
      notes: "",
    },
    addUnit: {
      unitCode: "",
      bedrooms: "",
      bathrooms: "",
      squareFeet: "",
      areaUnit: "sqft",
    },
  });

  function openModal(mode, unit) {
    setModalMode(mode);
    setActiveUnit(unit);
    setActionMessage("");
  }

  function closeModal() {
    setModalMode("");
    setActiveUnit(null);
  }

  function onChangeForm(event) {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [modalMode]: {
        ...prev[modalMode],
        [name]: value,
      },
    }));
  }

  async function submitForm(event) {
    event.preventDefault();

    try {
      if (modalMode === "add") {
        const propertyId = String(params?.id || "");
        const response = await fetch(
          `${BACKEND_URL}/api/v1/properties/${propertyId}/add-tenant`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-user-id": session?.user?.id || "",
            },
            body: JSON.stringify({
              unitId: activeUnit?.id,
              fullName: formData.add.fullName,
              email: formData.add.email,
              phone: formData.add.phone,
              startDate: formData.add.startDate,
              endDate: formData.add.endDate,
              monthlyRent: formData.add.monthlyRent,
              notes: formData.add.notes,
              currency: formData.add.currency,
            }),
          },
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.error || "Failed to add tenant");
        }

        setActionMessage(
          `${data?.createdUser ? "New user created" : "Existing user matched"} and assigned to ${activeUnit?.unitCode || "unit"}.`,
        );
        setFormData((prev) => ({
          ...prev,
          add: {
            fullName: "",
            email: "",
            phone: "",
            startDate: "",
            endDate: "",
            monthlyRent: "",
            currency: userCurrency,
            notes: "",
          },
        }));
        closeModal();
        await fetchUnits();
      } else if (modalMode === "remove") {
        // Remove tenant
        const propertyId = String(params?.id || "");
        const response = await fetch(
          `${BACKEND_URL}/api/v1/properties/${propertyId}/remove-tenant`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-user-id": session?.user?.id || "",
            },
            body: JSON.stringify({
              unitId: activeUnit?.id,
              leaveDate: formData.remove.leaveDate,
              forwardingAddress: formData.remove.forwardingAddress,
              reason: formData.remove.reason,
              depositReturnAmount: formData.remove.depositReturnAmount,
              notes: formData.remove.notes,
            }),
          },
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.error || "Failed to remove tenant");
        }

        setActionMessage(
          `Tenant successfully removed from ${activeUnit?.unitCode || "unit"}.`,
        );
        setFormData((prev) => ({
          ...prev,
          remove: {
            leaveDate: "",
            forwardingAddress: "",
            reason: "",
            depositReturnAmount: "",
            notes: "",
          },
        }));
        closeModal();
        await fetchUnits();
      } else if (modalMode === "addUnit") {
        // Add unit
        const propertyId = String(params?.id || "");
        const parsedArea = formData.addUnit.squareFeet
          ? Number(formData.addUnit.squareFeet)
          : null;
        const normalizedSquareFeet =
          parsedArea == null
            ? null
            : formData.addUnit.areaUnit === "sqm"
              ? Math.round(parsedArea * 10.7639)
              : Math.round(parsedArea);

        const response = await fetch(
          `${BACKEND_URL}/api/v1/properties/${propertyId}/units`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-user-id": session?.user?.id || "",
            },
            body: JSON.stringify({
              unitCode: formData.addUnit.unitCode,
              bedrooms: parseInt(formData.addUnit.bedrooms) || 0,
              bathrooms: parseInt(formData.addUnit.bathrooms) || 1,
              squareFeet: normalizedSquareFeet,
            }),
          },
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.error || "Failed to add unit");
        }

        setActionMessage(
          `Unit ${formData.addUnit.unitCode} successfully created.`,
        );
        setFormData((prev) => ({
          ...prev,
          addUnit: {
            unitCode: "",
            bedrooms: "",
            bathrooms: "",
            squareFeet: "",
            areaUnit: "sqft",
          },
        }));
        closeModal();
        await fetchUnits();
      }
    } catch (err) {
      setActionMessage(`Error: ${err.message}`);
    }
  }

  React.useEffect(() => {
    if (status !== "authenticated" || !session?.user?.id) {
      return;
    }
    const propertyId = String(params?.id || "");
    const cachedData = sessionStorage.getItem("properties");

    setProperty(
      cachedData
        ? JSON.parse(cachedData).find((p) => p.id === propertyId)
        : null,
    );
    let cancelled = false;

    async function loadUserSettingsOnce() {
      try {
        const response = await fetch(`${BACKEND_URL}/api/v1/user-settings`, {
          cache: "no-store",
          headers: {
            "x-user-id": session?.user?.id || "",
          },
        });

        if (!response.ok || cancelled) {
          return;
        }

        const data = await response.json();
        if (cancelled) {
          return;
        }

        if (data?.currency) {
          setUserCurrency(data.currency);
          setFormData((prev) => ({
            ...prev,
            add: {
              ...prev.add,
              currency: data.currency,
            },
          }));
        }
        if (data?.areaUnit || data?.area_unit) {
          setUserAreaUnit(data.areaUnit || data.area_unit);
        }
      } catch (err) {
        console.error("Failed to load user settings:", err);
      } finally {
        settingsLoadedRef.current = true;
      }
    }

    loadUserSettingsOnce();

    return () => {
      cancelled = true;
    };
  }, [status, session?.user?.id]);

  const fetchUnits = React.useCallback(async () => {
    if (!session?.user?.id || !params?.id) return;
    try {
      setError("");
      setLoading(true);
      const propertyId = String(params.id);
      const unitsResponse = await fetch(
        `${BACKEND_URL}/api/v1/units/${propertyId}`,
        {
          cache: "no-store",
          headers: {
            "x-user-id": session.user.id,
          },
        },
      );
      const unitsData = await unitsResponse.json();
      if (!unitsResponse.ok) {
        throw new Error(
          unitsData?.detail || unitsData?.error || "Failed to load units",
        );
      }
      const rawUnits = Array.isArray(unitsData)
        ? unitsData
        : Array.isArray(unitsData?.units)
          ? unitsData.units
          : [];
      setUnits(rawUnits);
    } catch (fetchError) {
      console.error("Error loading units:", fetchError);
      setError(fetchError.message || "Failed to load property data");
      setUnits([]);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id, params?.id]);

  React.useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.replace(APP_ROUTES.login);
      return;
    }
    if (session?.user?.id) {
      fetchUnits();
    }
  }, [status, session?.user?.id, router, fetchUnits]);





  const allUnits = React.useMemo(() => {
    const rawList = Array.isArray(property?.units)
      ? property.units
      : Array.isArray(units)
        ? units
        : Array.isArray(property)
          ? property
          : [];
    return rawList.map(normalizeUnit).filter(Boolean);
  }, [property, units]);

  const [unitFilter, setUnitFilter] = React.useState("all");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [currentPage, setCurrentPage] = React.useState(1);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [unitFilter, searchQuery]);


  

  const occupiedCount = allUnits.filter(
    (u) => getUnitStatus(u) === "occupied",
  ).length;
  const vacantCount = allUnits.filter(
    (u) => getUnitStatus(u) === "vacant",
  ).length;
  const maintenanceCount = allUnits.filter(
    (u) => getUnitStatus(u) === "maintenance",
  ).length;

  const occupancyPct =
    allUnits.length > 0
      ? ((occupiedCount / allUnits.length) * 100).toFixed(1)
      : "—";

  const filteredUnits = allUnits.filter((unit) => {
    const status = getUnitStatus(unit);
    const matchesFilter = unitFilter === "all" || unitFilter === status;
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      (unit.unitCode || "").toLowerCase().includes(q) ||
      (unit.name || "").toLowerCase().includes(q);
    return matchesFilter && matchesSearch;
  });

  const ITEMS_PER_PAGE = 10;
  const totalPages = Math.max(
    1,
    Math.ceil(filteredUnits.length / ITEMS_PER_PAGE),
  );
  const safePage = Math.min(currentPage, totalPages);
  const paginatedUnits = filteredUnits.slice(
    (safePage - 1) * ITEMS_PER_PAGE,
    safePage * ITEMS_PER_PAGE,
  );
  function handleExportCSV() {
    if (!allUnits || allUnits.length === 0) return;

    const exportData = allUnits.map((u) => ({
      "Unit Code": u.unitCode || u.unit_code || "—",
      "Bedrooms": u.bedrooms ?? 0,
      "Bathrooms": u.bathrooms ?? 0,
      "Square Feet": u.square_feet || u.squareFeet || "—",
      "Tenant Name": u.name || "Not Assigned",
      "Tenant Email": u.email || "—",
      "Lease End Date": u.end_date || u.endDate
        ? new Date(u.end_date || u.endDate).toLocaleDateString()
        : "Available Now",
    }));

    exportToCSV(exportData, `${property?.name || "property_units"}_export.csv`);
  }

  return (
    <main className='min-h-screen bg-slate-50 px-6 py-6'>
      {/* ── Loading ──────────────────────────────────────────────── */}
      {loading ? (
        <div className='rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500'>
          Loading property…
        </div>
      ) : null}

      {/* ── Error ────────────────────────────────────────────────── */}
      {!loading && error ? (
        <div className='rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-600'>
          {error}
        </div>
      ) : null}

      {!loading && !error ? (
        <>
          {/* Breadcrumb */}
          <nav className='mb-4 flex items-center gap-1.5 text-xs font-medium text-slate-400'>
            <Link
              href='/Properties'
              className='transition-colors hover:text-slate-700'>
              Portfolio
            </Link>
            <span>/</span>
            <span className='font-semibold text-slate-700'>
              Property {property?.name}
            </span>
          </nav>

          {/* Page header */}
          <div className='mb-6 flex flex-wrap items-start justify-between gap-4'>
            <div>
              <h1 className='text-3xl font-black text-slate-900'>
                Property {property?.name}
              </h1>
            </div>
            <div className='flex items-center gap-3'>
              <button
                type='button'
                onClick={handleExportCSV}
                disabled={!allUnits || allUnits.length === 0}
                className='flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 cursor-pointer'>
                <svg
                  className='h-4 w-4 text-emerald-600'
                  viewBox='0 0 20 20'
                  fill='currentColor'>
                  <path
                    fillRule='evenodd'
                    d='M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z'
                    clipRule='evenodd'
                  />
                </svg>
                Export Data
              </button>
              <button
                type='button'
                onClick={() => openModal("addUnit", null)}
                className='flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold text-white'
                style={{ backgroundColor: "#0f172a" }}>
                <svg
                  className='h-4 w-4'
                  viewBox='0 0 20 20'
                  fill='currentColor'>
                  <path
                    fillRule='evenodd'
                    d='M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z'
                    clipRule='evenodd'
                  />
                </svg>
                Add Unit
              </button>
            </div>
          </div>

          {/* KPI cards */}
          <div className='mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4'>
            <KpiCard
              title="Occupancy Rate"
              value={`${occupancyPct}%`}
              subtitle={`${occupiedCount} of ${allUnits.length} units`}
            />
            <KpiCard
              title="Annual Revenue"
              value="—"
              subtitle="No revenue data"
              accentColor="#10b981"
            />
            <KpiCard
              title="Total Units"
              value={allUnits.length}
              subtitle={`${vacantCount} vacant`}
            />
            <KpiCard
              title="Avg. Lease Term"
              value="—"
              subtitle="No lease data"
            />
          </div>

          {/* Units panel */}
          <TableWithSearch
            type="units"
            data={allUnits}
            loading={loading}
            userAreaUnit={userAreaUnit}
            openModal={openModal}
            filterTabs={[
              { key: "all", label: `All Units (${allUnits.length})` },
              { key: "occupied", label: `Occupied (${occupiedCount})` },
              { key: "vacant", label: `Vacant (${vacantCount})` },
              { key: "maintenance", label: `Maintenance (${maintenanceCount})` },
            ]}
            activeFilter={unitFilter}
            onFilterChange={setUnitFilter}
            searchPlaceholder="Search by unit number, tenant..."
            emptyMessage="No units have been added to this property yet."
          />

          {/* Toast */}
          {actionMessage ? (
            <div
              className='fixed bottom-4 right-4 z-50 max-w-sm rounded-2xl border px-4 py-3 text-sm font-semibold shadow-lg'
              style={
                actionMessage.startsWith("Error:")
                  ? {
                      borderColor: "#fca5a5",
                      color: "#dc2626",
                      backgroundColor: "#fef2f2",
                    }
                  : {
                      borderColor: "#86efac",
                      color: "#16a34a",
                      backgroundColor: "#f0fdf4",
                    }
              }>
              {actionMessage}
            </div>
          ) : null}

          <PropertyModalsContainer
            modalMode={modalMode}
            onClose={closeModal}
            activeUnit={activeUnit}
            formData={formData}
            onChangeForm={onChangeForm}
            onSubmitForm={submitForm}
            userCurrency={userCurrency}
          />
        </>
      ) : null}
    </main>
  );
}