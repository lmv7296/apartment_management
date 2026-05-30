"use client";

import React from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import BasicModal from "@/app/components/basic-modal";
import Progress from "./Progress";

const MapView = dynamic(() => import("@/app/components/maps/MapView"), {
  ssr: false,
  loading: () => (
    <div className='h-[400px] w-full animate-pulse rounded-2xl bg-slate-100 shadow-sm' />
  ),
});

const INITIAL_FORM = {
  name: "",
  propertyType: "Apartment",
  address: "",
  city: "",
  state: "",
  zip: "",
  totalUnits: "",
  yearBuilt: String(new Date().getFullYear()),
  squareFeet: "",
  amenities: {
    privateParking: false,
    fitnessCenter: false,
    infinityPool: false,
    security247: false,
  },
  underConstruction: false,
  phases: [],
};

export default function ProjectDetailView() {
  const { id } = useParams(); // Get ID from [id] folder
  const [project, setProject] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [updateError, setUpdateError] = React.useState(null);

  const handleUpdateProgress = async (projectId, updatedPhases) => {
    setIsUpdating(true);
    setUpdateError(null);
    try {
      // Recalculate total project completion percentage based on all phases
      const totalPhases = updatedPhases.length;
      const totalProgress = updatedPhases.reduce(
        (acc, p) => acc + (p.progress || 0),
        0,
      );
      const newTotalCompletion =
        totalPhases > 0 ? Math.round(totalProgress / totalPhases) : 0;

      const res = await fetch(`/api/v1/construction/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phases: updatedPhases,
          total_completion_pct: newTotalCompletion,
        }),
      });

      if (!res.ok) throw new Error("Failed to update project progress");
      const data = await res.json();
      setProject(data); // Update local state with the saved data
      return true; // Return success to close the modal
    } catch (err) {
      setUpdateError(err.message);
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  const [formData, setFormData] = React.useState(INITIAL_FORM);

  function onChangeForm(event) {
    const { name, type, value, checked } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  React.useEffect(() => {
    const controller = new AbortController();

    async function loadProject() {
      try {
        const res = await fetch(`/api/v1/construction/${id}`, {
          signal: controller.signal,
        });
        const data = await res.json();

        if (!res.ok) throw new Error(data.error || "Failed to load project");
        setProject(data);
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    if (id) loadProject();

    return () => controller.abort();
  }, [id]);

  if (loading)
    return (
      <div className='flex min-h-screen items-center justify-center bg-[#f8fafc]'>
        <div className='text-center'>
          <div className='h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-[#001f3f] mx-auto mb-4'></div>
          <p className='font-bold text-slate-400'>Loading Project Details...</p>
        </div>
      </div>
    );
  if (error)
    return <div className='p-10 text-red-500 font-bold'>Error: {error}</div>;
  if (!project) return null;

  return (
    <div className='min-h-screen bg-[#f8fafc] pb-20'>
      {/* Navigation Breadcrumb */}
      <div className='bg-white border-b border-slate-200 px-6 py-4 lg:px-10'>
        <Link
          href='/Construction'
          className='group flex items-center gap-2 text-xs font-bold text-slate-500 transition-colors hover:text-[#001f3f]'>
          <svg
            xmlns='http://www.w3.org/2000/svg'
            width='16'
            height='16'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='3'
            strokeLinecap='round'
            strokeLinejoin='round'
            className='transition-transform group-hover:-translate-x-1'>
            <path d='m15 18-6-6 6-6' />
          </svg>
          BACK TO PROJECTS
        </Link>
      </div>

      {/* Dynamic Header Section */}
      <div className='p-6 lg:p-10 flex flex-col justify-between gap-6 md:flex-row md:items-end'>
        <div className='space-y-2'>
          <div className='flex items-center gap-3'>
            <span className='rounded bg-slate-200 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-slate-700'>
              Active Development
            </span>
            <span className='text-xs font-bold text-slate-400 flex items-center gap-1'>
              <svg
                xmlns='http://www.w3.org/2000/svg'
                width='14'
                height='14'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'>
                <path d='M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z' />
                <polyline points='14 2 14 8 20 8' />
              </svg>
              Permit #{project.permit_number}
            </span>
          </div>
          <h1 className='text-4xl font-black tracking-tight text-[#001f3f]'>
            {project.name}
          </h1>
          <div className='flex flex-wrap gap-6 text-[11px] font-bold text-slate-500 uppercase tracking-wide'>
            <span className='flex items-center gap-1.5'>
              <svg
                xmlns='http://www.w3.org/2000/svg'
                width='14'
                height='14'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
                className='text-slate-400'>
                <path d='M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z' />
                <circle cx='12' height='10' r='3' />
              </svg>
              {project.address}
            </span>
            <span className='flex items-center gap-1.5'>
              <svg
                xmlns='http://www.w3.org/2000/svg'
                width='14'
                height='14'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
                className='text-slate-400'>
                <rect width='18' height='18' x='3' y='4' rx='2' ry='2' />
                <line x1='16' x2='16' y1='2' y2='6' />
                <line x1='8' x2='8' y1='2' y2='6' />
                <line x1='3' x2='21' y1='10' y2='10' />
              </svg>
              Handover:{" "}
              {new Date(project.estimated_completion).toLocaleDateString(
                "en-US",
                { month: "short", year: "numeric" },
              )}
            </span>
          </div>
        </div>

        <div className='flex flex-col items-start md:items-end bg-white p-6 rounded-2xl shadow-sm border border-slate-100 min-w-[280px]'>
          <span className='mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400'>
            Overall Completion
          </span>
          <div className='flex items-center gap-4'>
            <span className='text-4xl font-black text-[#001f3f]'>
              {project.total_completion_pct}%
            </span>
            <div className='h-3 w-32 md:w-48 rounded-full bg-slate-100 overflow-hidden'>
              <div
                className='h-full bg-[#001f3f] transition-all duration-1000 ease-out'
                style={{ width: `${project.total_completion_pct}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className='px-6 lg:px-10 grid grid-cols-1 gap-8 lg:grid-cols-12'>
        {/* Main Column */}
        <div className='space-y-8 lg:col-span-8'>
          {/* Phase Grid - Mapped from DB JSON */}
          <Progress
            project={project}
            onSubmit={handleUpdateProgress}
            isSubmitting={isUpdating}
            error={updateError}
          />
          {/* Activity Feed - Dynamic from Logs */}
          <div className='space-y-4'>
            <h4 className='text-xs font-bold uppercase tracking-widest text-slate-400'>
              Site Activity Feed
            </h4>
            <div className='space-y-0 relative before:absolute before:inset-0 before:ml-10 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-slate-200 before:via-slate-200 before:to-transparent'>
              {project.activity?.map((log) => (
                <div
                  key={log.id}
                  className='relative flex items-start gap-6 pb-8 group'>
                  {/* Date Circle */}
                  <div className='flex h-20 w-20 flex-col items-center justify-center rounded-2xl bg-white border-2 border-slate-100 shadow-sm z-10 transition-colors group-hover:border-[#001f3f]'>
                    <span className='text-xl font-black text-[#001f3f] leading-none'>
                      {new Date(log.created_at).getDate()}
                    </span>
                    <span className='text-[9px] font-black uppercase text-slate-400'>
                      {new Date(log.created_at).toLocaleString("default", {
                        month: "short",
                      })}
                    </span>
                  </div>

                  {/* Content Card */}
                  <div className='flex-1 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-all hover:shadow-md'>
                    <div className='flex flex-col md:flex-row md:items-center justify-between gap-2 mb-3'>
                      <h4 className='text-lg font-bold text-[#001f3f]'>
                        {log.title}
                      </h4>
                      <span className='inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-600'>
                        VERIFIED BY {log.author_role}
                      </span>
                    </div>
                    <p className='text-sm text-slate-600 leading-relaxed italic'>
                      "{log.description}"
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className='space-y-6 lg:col-span-4'>
          <div className='rounded-3xl border border-slate-100 bg-white p-6 shadow-sm'>
            {/* Map Visualization */}
            <div className='mb-10'>
              <MapView
                buildings={project ? [project] : []}
                address={project?.full_formatted_address || project?.address}
              />
            </div>
            <p className='text-xs font-bold text-slate-500'>
              {project.address}
            </p>
          </div>

          {/* Personnel Widget */}
          <div className='rounded-3xl border border-slate-100 bg-white p-6 shadow-sm'>
            <h4 className='mb-4 text-[10px] font-bold uppercase text-slate-400'>
              Key Personnel
            </h4>
            <div className='space-y-4'>
              <div className='flex items-center gap-3'>
                <div className='h-10 w-10 rounded-full bg-slate-200' />
                <div>
                  <div className='text-xs font-bold text-[#001f3f]'>
                    {project.contractor_name || "Unassigned"}
                  </div>
                  <div className='text-[10px] font-bold text-slate-400 uppercase'>
                    Primary Contractor
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
