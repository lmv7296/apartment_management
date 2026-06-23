"use client";

import React from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useSession } from "next-auth/react";
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";

const ConstructionModal = dynamic(
  () => import("@/app/components/modals/addConstructionModal"),
  {
    ssr: false,
  },
);

export default function Construction() {
  const { data: session } = useSession();
  const [construction, setConstruction] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isConstructionModalOpen, setIsConstructionModalOpen] =
    React.useState(false);

  React.useEffect(() => {
    async function fetchConstruction() {
      try {
        const response = await fetch(`${BACKEND_URL}/api/v1/construction`, {
          headers: {
            "x-user-id": session?.user?.id || ""
          }
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data?.detail || data?.error || "Failed to load buildings",
          );
        }
        setConstruction(data);
      } catch (error) {
        console.error("Error fetching buildings:", error);
      } finally {
        setIsLoading(false);
      }
    }
    if (session?.user?.id) {
      fetchConstruction();
    }
  }, [session?.user?.id]);

  const handleProjectSave = async (payload) => {
    try {
      setIsLoading(true);
      console.log("Submitting Construction Payload:", payload);
      const res = await fetch(`${BACKEND_URL}/api/v1/construction`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-user-id": session?.user?.id || ""
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsConstructionModalOpen(false);
        setIsLoading(false);
        // Refresh your list or redirect to the new project
        window.location.reload();
      }
    } catch (error) {
      console.error("Failed to save project", error);
    }
  };

  if (isLoading) {
    return (
      <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 backdrop-blur-[2px]'>
        <div className='flex items-center gap-4 rounded-2xl bg-white px-6 py-4 shadow-xl border border-slate-100'>
          <div className='h-6 w-6 animate-spin rounded-full border-3 border-slate-100 border-t-[#001f3f]' />
          <span className='text-xs font-bold uppercase tracking-wider text-[#001f3f]'></span>
        </div>
      </div>
    );
  }

  return (
    <>
      <ConstructionModal
        isOpen={isConstructionModalOpen}
        onClose={() => setIsConstructionModalOpen(false)}
        onSave={handleProjectSave}
      />
      <div className='min-h-screen bg-[#f8fafc] p-8'>
        {/* Header Section */}
        <div className='mb-10 grid grid-cols-2 items-start'>
          <h1 className='text-2xl font-black text-[#001f3f]'>
            Construction Tracking
          </h1>
          <div className='justify-self-end w-[250px] flex items-center justify-center gap-2 rounded-lg bg-[#001f3f] px-4 py-2 text-sm font-bold text-white hover:bg-[#001a35]'>
            <button
              className='inline-flex hover:cursor-pointer rounded-md px-3 py-1.5 transition-colors duration-200'
              onClick={() => setIsConstructionModalOpen(true)}>
              <svg
                className='h-4 w-4 mr-2'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M12 4v16m8-8H4'
                />
              </svg>
              Add New Construction
            </button>
          </div>
          <p className='mt-1 text-sm font-semibold text-slate-500'>
            Real-time oversight of development pipeline and structural
            milestones.
          </p>
        </div>

        {/* Portfolio Grid */}
        <div className='mb-6 flex items-center gap-4'>
          <h4 className='text-xs font-bold uppercase tracking-widest text-slate-400'>
            Active Development Portfolio
          </h4>
          <div className='h-px flex-1 bg-slate-200' />
        </div>

        <div className='grid grid-cols-1 gap-6'>
          {construction?.map((building) => {
            const phases = building.phases || [];
            const calculatedProgress =
              phases.length > 0
                ? Math.round(
                    phases.reduce((acc, p) => acc + (p.progress || 0), 0) /
                      phases.length,
                  )
                : building.progress || 0;

            return (
              <Link
                key={building.id}
                href={`/Construction/${building.id}`}
                className='rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50'>
                <div className='group flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white transition-all hover:shadow-lg md:flex-row'>
                  {/* Image Placeholder - Matching the left-side images in image_8fad32.jpg */}
                  <div className='h-48 w-full bg-slate-200 md:h-auto md:w-72 lg:w-80'>
                    <div className='flex h-full items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200'>
                      <svg
                        className='h-12 w-12 text-slate-300'
                        fill='currentColor'
                        viewBox='0 0 24 24'>
                        <path d='M19 2H5c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-7 2h2v5h-2V4zm-4 0h2v5H8V4zm0 16v-9h2v9H8zm4 0v-9h2v9h-2zm4 0v-9h2v9h-2zm0-11V4h2v5h-2z' />
                      </svg>
                    </div>
                  </div>

                  {/* Content Area */}
                  <div className='flex flex-1 flex-col p-6'>
                    <div className='mb-4 flex items-start justify-between'>
                      <div>
                        <h3 className='text-lg font-bold text-[#001f3f]'>
                          {building.name}
                        </h3>
                        <div className='mt-1 flex items-center gap-1.5 text-xs font-bold text-slate-500'>
                          <svg
                            className='h-3.5 w-3.5'
                            fill='none'
                            viewBox='0 0 24 24'
                            stroke='currentColor'>
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              strokeWidth={2}
                              d='M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z'
                            />
                          </svg>
                          {building.location || "District Waterfront, Sector 4"}
                        </div>
                      </div>

                      {/* Status Badge */}
                      <span className='rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-600'>
                        {building.status || "In Progress"}
                      </span>
                    </div>

                    {/* Progress Bar - Matching the "Construction Progress" style in image_8fad32.jpg */}
                    <div className='mb-6 mt-auto'>
                      <div className='mb-2 flex items-center justify-between text-[11px] font-bold uppercase tracking-tight'>
                        <span className='text-slate-400'>
                          Construction Progress
                        </span>
                        <span className='text-[#001f3f]'>
                          {calculatedProgress}%
                        </span>
                      </div>
                      <div className='h-2 w-full rounded-full bg-slate-100'>
                        <div
                          className='h-full rounded-full bg-[#001f3f] transition-all duration-1000'
                          style={{ width: `${calculatedProgress}%` }}
                        />
                      </div>
                    </div>

                    {/* Footer Info */}
                    <div className='flex items-center justify-between border-t border-slate-50 pt-4'>
                      <div className='flex flex-col'>
                        <span className='text-[10px] font-bold uppercase text-slate-400'>
                          Contractor
                        </span>
                        <span className='text-xs font-bold text-slate-700'>
                          {building.contractor || "Axon Build Group"}
                        </span>
                      </div>
                      <button className='text-xs font-bold text-[#001f3f] hover:underline'>
                        View Full Schedule →
                      </button>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
