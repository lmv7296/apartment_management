import React, { useState, useEffect } from "react";
import { Country, State, City } from "country-state-city";

export default function AddConstructionModal({ isOpen, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    country: "",
    state: "",
    city: "",
    zipcode: "",
    permit_number: "",
    budget_total: "",
    estimated_completion: "",
    contractor_name: "",
  });

  useEffect(() => {
    if (isOpen) {
      // Disable scrolling on the body
      document.body.style.overflow = "hidden";
    } else {
      // Re-enable scrolling
      document.body.style.overflow = "unset";
    }
    // Cleanup function to ensure scrolling is restored if the component unmounts
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Convert string numbers to integers/floats before sending to API

    const countryName = Country.getCountryByCode(formData.country)?.name || "";
    const stateName =
      State.getStateByCodeAndCountry(formData.state, formData.country)?.name ||
      "";
    const fullAddress = `${formData.address}, ${formData.city}, ${stateName}, ${formData.zipcode}, ${countryName}`;

    const submissionData = {
      ...formData,
      country: countryName,
      state: stateName,
      full_formatted_address: fullAddress, // Useful for geocoding
      budget_total: parseFloat(formData.budget_total) || 0,
      under_construction: true,
    };
    onSave(submissionData);
  };

  const countries = Country.getAllCountries();
  const states = formData.country
    ? State.getStatesOfCountry(formData.country)
    : [];
  const cities =
    formData.country && formData.state
      ? City.getCitiesOfState(formData.country, formData.state)
      : [];

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4'>
      <div className='w-full max-w-xl rounded-3xl bg-white p-8 shadow-2xl overflow-y-auto max-h-[90vh]'>
        <div className='mb-6 flex items-center justify-between'>
          <h2 className='text-xl font-black text-[#001f3f]'>
            Initialize New Project
          </h2>
          <button
            onClick={onClose}
            className='text-slate-400 hover:text-slate-600'>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className='space-y-5'>
          {/* Project Name */}
          <div>
            <label className='text-[10px] font-bold uppercase tracking-widest text-slate-400'>
              Project Name
            </label>
            <input
              required
              type='text'
              className='mt-1 w-full rounded-xl border border-slate-100 bg-slate-50 p-3 text-sm font-bold text-[#001f3f] focus:outline-none focus:ring-2 focus:ring-blue-500'
              placeholder='e.g., Harbor Heights Phase II'
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
          </div>

          <div className='grid grid-cols-2 gap-4'>
            {/* Permit Number */}
            <div>
              <label className='text-[10px] font-bold uppercase tracking-widest text-slate-400'>
                Permit #
              </label>
              <input
                type='text'
                className='mt-1 w-full rounded-xl border border-slate-100 bg-slate-50 p-3 text-sm font-bold text-[#001f3f]'
                placeholder='XP-9920'
                value={formData.permit_number}
                onChange={(e) =>
                  setFormData({ ...formData, permit_number: e.target.value })
                }
              />
            </div>
            {/* Total Budget */}
            <div>
              <label className='text-[10px] font-bold uppercase tracking-widest text-slate-400'>
                Budget ($M)
              </label>
              <input
                type='number'
                step='0.1'
                className='mt-1 w-full rounded-xl border border-slate-100 bg-slate-50 p-3 text-sm font-bold text-[#001f3f]'
                placeholder='42.8'
                value={formData.budget_total}
                onChange={(e) =>
                  setFormData({ ...formData, budget_total: e.target.value })
                }
              />
            </div>
          </div>

          {/* Location Details Group */}
          <div className='space-y-4 rounded-2xl border border-slate-50 bg-slate-50/50 p-4'>
            <div className='grid grid-cols-2 gap-4'>
              {/* Country Select */}
              <div>
                <label className='text-[10px] font-bold uppercase tracking-widest text-slate-400'>
                  Country
                </label>
                <select
                  required
                  className='mt-1 w-full rounded-xl border border-slate-100 bg-white p-3 text-sm font-bold text-[#001f3f]'
                  value={formData.country}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      country: e.target.value,
                      state: "",
                      city: "",
                    })
                  }>
                  <option value=''>Select Country</option>
                  {countries.map((country) => (
                    <option key={country.isoCode} value={country.isoCode}>
                      {country.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* State/Province Select */}
              <div>
                <label className='text-[10px] font-bold uppercase tracking-widest text-slate-400'>
                  State / Province
                </label>
                <select
                  required
                  disabled={!formData.country}
                  className='mt-1 w-full rounded-xl border border-slate-100 bg-white p-3 text-sm font-bold text-[#001f3f] disabled:opacity-50'
                  value={formData.state}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      state: e.target.value,
                      city: "",
                    })
                  }>
                  <option value=''>Select State</option>
                  {states.map((state) => (
                    <option key={state.isoCode} value={state.isoCode}>
                      {state.name}
                    </option>
                  ))}
                </select>
              </div>
              {/* City Select */}
              <div>
                <label className='text-[10px] font-bold uppercase tracking-widest text-slate-400'>
                  City
                </label>
                <select
                  required
                  disabled={!formData.state}
                  className='mt-1 w-full rounded-xl border border-slate-100 bg-white p-3 text-sm font-bold text-[#001f3f] disabled:opacity-50'
                  value={formData.city}
                  onChange={(e) =>
                    setFormData({ ...formData, city: e.target.value })
                  }>
                  <option value=''>Select City</option>
                  {cities.map((city) => (
                    <option key={city.name} value={city.name}>
                      {city.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Zipcode */}
              <div>
                <label className='text-[10px] font-bold uppercase tracking-widest text-slate-400'>
                  Zipcode
                </label>
                <input
                  type='text'
                  className='mt-1 w-full rounded-xl border border-slate-100 bg-white p-3 text-sm font-bold text-[#001f3f]'
                  placeholder='e.g., 5000'
                  value={formData.zipcode}
                  onChange={(e) =>
                    setFormData({ ...formData, zipcode: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Street Address */}
            <div>
              <label className='text-[10px] font-bold uppercase tracking-widest text-slate-400'>
                Street & Number
              </label>
              <input
                required
                type='text'
                className='mt-1 w-full rounded-xl border border-slate-100 bg-white p-3 text-sm font-bold text-[#001f3f]'
                placeholder='e.g., Carlos Linneo 5240'
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
              />
            </div>
          </div>

          {/* Date Picker */}
          <div>
            <label className='text-[10px] font-bold uppercase tracking-widest text-slate-400'>
              Est. Handover Date
            </label>
            <input
              type='date'
              className='mt-1 w-full rounded-xl border border-slate-100 bg-slate-50 p-3 text-sm font-bold text-[#001f3f]'
              value={formData.estimated_completion}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  estimated_completion: e.target.value,
                })
              }
            />
          </div>

          <div className='flex gap-3 pt-4'>
            <button
              type='button'
              onClick={onClose}
              className='flex-1 rounded-xl bg-slate-100 py-3 text-xs font-bold text-slate-500 hover:bg-slate-200'>
              Cancel
            </button>
            <button
              type='submit'
              className='flex-1 rounded-xl bg-[#001f3f] py-3 text-xs font-bold text-white shadow-lg hover:bg-blue-900'>
              Start Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
