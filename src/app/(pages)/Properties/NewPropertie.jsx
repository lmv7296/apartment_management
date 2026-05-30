"use client";

import React from "react";
import BasicModal from "@/app/components/basic-modal";

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
};

export default function NewProperty({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  error,
  defaultUnitCount = 0,
  defaultUnitPrefix = "Unit",
}) {
  const [formData, setFormData] = React.useState(INITIAL_FORM);

  React.useEffect(() => {
    if (isOpen) {
      setFormData({
        ...INITIAL_FORM,
        totalUnits:
          Number.isFinite(Number(defaultUnitCount)) &&
          Number(defaultUnitCount) > 0
            ? String(defaultUnitCount)
            : "",
      });
      return;
    }

    setFormData(INITIAL_FORM);
  }, [isOpen, defaultUnitCount]);

  function onChangeForm(event) {
    const { name, type, value, checked } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function onToggleAmenity(event) {
    const { name, checked } = event.target;
    setFormData((current) => ({
      ...current,
      amenities: {
        ...current.amenities,
        [name]: checked,
      },
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();

    const parsedUnits = Number.parseInt(String(formData.totalUnits || 0), 10);
    const parsedYear = Number.parseInt(String(formData.yearBuilt || ""), 10);
    const parsedSqft = Number.parseInt(String(formData.squareFeet || ""), 10);

    onSubmit({
      name: formData.name.trim(),
      propertyType: formData.propertyType,
      address: formData.address.trim(),
      city: formData.city.trim(),
      state: formData.state.trim(),
      zip: formData.zip.trim(),
      totalUnits: Number.isNaN(parsedUnits) ? 0 : parsedUnits,
      yearBuilt: Number.isNaN(parsedYear) ? null : parsedYear,
      squareFeet: Number.isNaN(parsedSqft) ? null : parsedSqft,
      amenities: formData.amenities,
      unitPrefix: defaultUnitPrefix,
    });
  }

  return (
    <BasicModal
      isOpen={isOpen}
      onClose={onClose}
      eyebrow='Portfolio Management'
      title='Create New Asset'
      headerAction={
        <button
          type='button'
          onClick={onClose}
          className='rounded-full p-1.5 text-slate-500 hover:bg-slate-100'
          aria-label='Close add property modal'>
          <svg className='h-5 w-5' viewBox='0 0 20 20' fill='currentColor'>
            <path
              fillRule='evenodd'
              d='M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z'
              clipRule='evenodd'
            />
          </svg>
        </button>
      }
      maxWidthClass='max-w-3xl'
      footer={
        <div className='grid w-full grid-cols-1 gap-2 sm:grid-cols-2'>
          <button
            type='button'
            onClick={onClose}
            className='rounded-xl border px-4 py-3 text-sm font-semibold'
            style={{
              borderColor: "var(--border)",
              color: "var(--text)",
              backgroundColor: "var(--surface-2)",
            }}
            disabled={isSubmitting}>
            Cancel
          </button>
          <button
            type='submit'
            form='add-property-form'
            className='rounded-xl px-4 py-3 text-sm font-bold text-white disabled:opacity-60'
            style={{
              backgroundColor: "#0b2f66",
            }}
            disabled={isSubmitting}>
            <span className='inline-flex items-center gap-2'>
              {isSubmitting ? "Saving..." : "Save Property"}
            </span>
          </button>
        </div>
      }>
      <form
        id='add-property-form'
        onSubmit={handleSubmit}
        className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
        <section
          className='rounded-2xl border p-4'
          style={{
            borderColor: "var(--border)",
            backgroundColor: "var(--surface)",
          }}>
          <h4 className='mb-4 flex items-center gap-2 text-lg font-black text-slate-900'>
            Basic Information
          </h4>
          <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
            <label className='flex flex-col gap-1'>
              <span className='text-xs font-semibold uppercase app-text-muted'>
                Property Name
              </span>
              <input
                required
                name='name'
                value={formData.name}
                onChange={onChangeForm}
                placeholder='e.g. The Harbor Heights'
                className='rounded-xl border px-3 py-2 outline-none'
                style={{
                  borderColor: "var(--border)",
                  backgroundColor: "var(--surface-2)",
                }}
              />
            </label>

            <label className='flex flex-col gap-1'>
              <span className='text-xs font-semibold uppercase app-text-muted'>
                Property Type
              </span>
              <select
                name='propertyType'
                value={formData.propertyType}
                onChange={onChangeForm}
                className='rounded-xl border px-3 py-2 outline-none'
                style={{
                  borderColor: "var(--border)",
                  backgroundColor: "var(--surface-2)",
                }}>
                <option value='Apartment'>Apartment</option>
                <option value='Condo'>Condo</option>
                <option value='Townhouse'>Townhouse</option>
                <option value='Mixed Use'>Mixed Use</option>
              </select>
            </label>

            <label className='flex flex-col gap-1 sm:col-span-2'>
              <span className='text-xs font-semibold uppercase app-text-muted'>
                Detailed Address
              </span>
              <textarea
                required
                name='address'
                value={formData.address}
                onChange={onChangeForm}
                placeholder='Street name, building number, suite...'
                rows={2}
                className='rounded-xl border px-3 py-2 outline-none'
                style={{
                  borderColor: "var(--border)",
                  backgroundColor: "var(--surface-2)",
                }}
              />
            </label>

            <label className='flex flex-col gap-1'>
              <span className='text-xs font-semibold uppercase app-text-muted'>
                City
              </span>
              <input
                name='city'
                value={formData.city}
                onChange={onChangeForm}
                className='rounded-xl border px-3 py-2 outline-none'
                style={{
                  borderColor: "var(--border)",
                  backgroundColor: "var(--surface-2)",
                }}
              />
            </label>

            <label className='flex flex-col gap-1'>
              <span className='text-xs font-semibold uppercase app-text-muted'>
                State
              </span>
              <input
                name='state'
                value={formData.state}
                onChange={onChangeForm}
                className='rounded-xl border px-3 py-2 outline-none'
                style={{
                  borderColor: "var(--border)",
                  backgroundColor: "var(--surface-2)",
                }}
              />
            </label>

            <label className='flex flex-col gap-1'>
              <span className='text-xs font-semibold uppercase app-text-muted'>
                ZIP
              </span>
              <input
                name='zip'
                value={formData.zip}
                onChange={onChangeForm}
                className='rounded-xl border px-3 py-2 outline-none'
                style={{
                  borderColor: "var(--border)",
                  backgroundColor: "var(--surface-2)",
                }}
              />
            </label>
          </div>
        </section>

        <section className='grid grid-cols-1 gap-4'>
          <div
            className='rounded-2xl border p-4'
            style={{
              borderColor: "var(--border)",
              backgroundColor: "var(--surface)",
            }}>
            <h4 className='mb-4 text-lg font-black text-slate-900'>Media</h4>
            <div
              className='mb-3 flex min-h-30 items-center justify-center rounded-xl border border-dashed text-center text-sm font-semibold text-slate-500'
              style={{
                borderColor: "var(--border)",
                backgroundColor: "var(--surface-2)",
              }}>
              Upload property photos
            </div>
            <div className='grid grid-cols-4 gap-2'>
              {Array.from({ length: 4 }, (_, index) => (
                <div
                  key={index}
                  className='flex h-14 items-center justify-center rounded-lg border text-slate-400'
                  style={{
                    borderColor: "var(--border)",
                    backgroundColor: "var(--surface-2)",
                  }}>
                  {index === 0 ? "-" : "+"}
                </div>
              ))}
            </div>
          </div>

          <div
            className='rounded-2xl border p-4'
            style={{
              borderColor: "var(--border)",
              backgroundColor: "var(--surface)",
            }}>
            <h4 className='mb-3 text-lg font-black text-slate-900'>
              Amenities
            </h4>
            <div className='space-y-2 text-sm font-semibold text-slate-700'>
              <label className='flex items-center gap-2'>
                <input
                  type='checkbox'
                  name='privateParking'
                  checked={formData.amenities.privateParking}
                  onChange={onToggleAmenity}
                />
                Private Parking
              </label>
              <label className='flex items-center gap-2'>
                <input
                  type='checkbox'
                  name='fitnessCenter'
                  checked={formData.amenities.fitnessCenter}
                  onChange={onToggleAmenity}
                />
                Fitness Center
              </label>
              <label className='flex items-center gap-2'>
                <input
                  type='checkbox'
                  name='infinityPool'
                  checked={formData.amenities.infinityPool}
                  onChange={onToggleAmenity}
                />
                Infinity Pool
              </label>
              <label className='flex items-center gap-2'>
                <input
                  type='checkbox'
                  name='security247'
                  checked={formData.amenities.security247}
                  onChange={onToggleAmenity}
                />
                24/7 Security
              </label>
            </div>
          </div>
        </section>

        <section
          className='rounded-2xl border p-4 lg:col-span-2'
          style={{
            borderColor: "var(--border)",
            backgroundColor: "var(--surface)",
          }}>
          <h4 className='mb-4 text-lg font-black text-slate-900'>
            Property Metrics
          </h4>
          <div className='grid grid-cols-1 gap-3 sm:grid-cols-3'>
            <label
              className='rounded-xl border p-3'
              style={{
                borderColor: "var(--border)",
                backgroundColor: "var(--surface-2)",
              }}>
              <span className='text-[11px] font-semibold uppercase app-text-muted'>
                Total Units
              </span>
              <input
                type='number'
                min='0'
                step='1'
                name='totalUnits'
                value={formData.totalUnits}
                onChange={onChangeForm}
                className='mt-1 w-full bg-transparent text-2xl font-black outline-none'
                placeholder='0'
              />
              <span className='mt-1 block text-[11px] app-text-muted'>
                Unit codes will use "{defaultUnitPrefix || "(none)"}" prefix.
              </span>
            </label>

            <label
              className='rounded-xl border p-3'
              style={{
                borderColor: "var(--border)",
                backgroundColor: "var(--surface-2)",
              }}>
              <span className='text-[11px] font-semibold uppercase app-text-muted'>
                Year Built
              </span>
              <input
                type='number'
                min='1800'
                max='2100'
                name='yearBuilt'
                value={formData.yearBuilt}
                onChange={onChangeForm}
                className='mt-1 w-full bg-transparent text-2xl font-black outline-none'
              />
            </label>

            <label
              className='rounded-xl border p-3'
              style={{
                borderColor: "var(--border)",
                backgroundColor: "var(--surface-2)",
              }}>
              <span className='text-[11px] font-semibold uppercase app-text-muted'>
                Sq. Footage
              </span>
              <input
                type='number'
                min='0'
                step='1'
                name='squareFeet'
                value={formData.squareFeet}
                onChange={onChangeForm}
                className='mt-1 w-full bg-transparent text-2xl font-black outline-none'
                placeholder='0'
              />
            </label>
          </div>
        </section>

        {error ? (
          <p className='rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 lg:col-span-2'>
            {error}
          </p>
        ) : null}
      </form>
    </BasicModal>
  );
}
