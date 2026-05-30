"use client";

import React, { useState, useEffect } from "react";
import { Country, State, City } from "country-state-city";

export default function AddConstructionModal({ isOpen, onClose, onSave }) {
  const [step, setStep] = useState(1);
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
    phases: [
      {
        label: "Initial Phase",
        progress: 0,
        steps: [{ text: "", completed: false }],
      },
    ],
  });

  useEffect(() => {
    if (isOpen) {
      // Disable scrolling on the body
      document.body.style.overflow = "hidden";
    } else {
      // Re-enable scrolling
      document.body.style.overflow = "unset";
      setStep(1); // Reset to step 1 when closed
    }
    // Cleanup function to ensure scrolling is restored if the component unmounts
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Phase & Step Management
  const addPhase = () => {
    setFormData((prev) => {
      const newPhases = [
        ...prev.phases,
        { label: "", progress: 0, steps: [{ text: "", completed: false }] },
      ];
      return { ...prev, phases: newPhases };
    });
  };

  const updatePhaseLabel = (index, label) => {
    setFormData((prev) => {
      const newPhases = [...prev.phases];
      newPhases[index] = { ...newPhases[index], label };
      return { ...prev, phases: newPhases };
    });
  };

  const removePhase = (index) => {
    setFormData((prev) => {
      const newPhases = prev.phases.filter((_, i) => i !== index);
      return { ...prev, phases: newPhases };
    });
  };

  const addStep = (phaseIndex) => {
    setFormData((prev) => {
      const newPhases = [...prev.phases];
      const newSteps = [
        ...newPhases[phaseIndex].steps,
        { text: "", completed: false },
      ];
      newPhases[phaseIndex] = { ...newPhases[phaseIndex], steps: newSteps };
      return { ...prev, phases: newPhases };
    });
  };

  const updateStepText = (phaseIndex, stepIndex, text) => {
    setFormData((prev) => {
      const newPhases = [...prev.phases];
      const newSteps = [...newPhases[phaseIndex].steps];
      newSteps[stepIndex] = { ...newSteps[stepIndex], text };
      newPhases[phaseIndex] = { ...newPhases[phaseIndex], steps: newSteps };
      return { ...prev, phases: newPhases };
    });
  };

  const removeStep = (phaseIndex, stepIndex) => {
    setFormData((prev) => {
      const newPhases = [...prev.phases];
      const newSteps = newPhases[phaseIndex].steps.filter(
        (_, i) => i !== stepIndex,
      );
      newPhases[phaseIndex] = { ...newPhases[phaseIndex], steps: newSteps };
      return { ...prev, phases: newPhases };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // If we are on step 1, advance to step 2 instead of saving
    if (step === 1) {
      setStep(2);
      return;
    }

    const countryName = Country.getCountryByCode(formData.country)?.name || "";
    const stateName =
      State.getStateByCodeAndCountry(formData.state, formData.country)?.name ||
      "";
    const fullAddress = `${formData.address}, ${formData.city}, ${stateName}, ${formData.zipcode}, ${countryName}`;

    // Clean up empty phases and map 'steps' to 'PhaseSteps' for backend compatibility
    const submissionPhases = formData.phases
      .filter((p) => p.label.trim() !== "")
      .map((p) => ({
        label: p.label,
        progress: p.progress || 0,
        PhaseSteps: p.steps.filter((s) => s.text.trim() !== ""), // Mapping to the key you mentioned
      }));

    const submissionData = {
      ...formData,
      country: countryName,
      state: stateName,
      full_formatted_address: fullAddress, // Useful for geocoding
      budget_total: parseFloat(formData.budget_total) || 0,
      under_construction: true,
      phases: submissionPhases,
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
      <div className='w-full max-w-4xl rounded-3xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]'>
        {/* Header */}
        <div className='px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50'>
          <div>
            <h2 className='text-xl font-black text-[#001f3f]'>
              Initialize New Project
            </h2>
            <p className='text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1'>
              Step {step} of 2:{" "}
              {step === 1 ? "Project Basics" : "Construction Roadmap"}
            </p>
          </div>
          <button
            onClick={onClose}
            className='text-slate-400 hover:text-slate-600'>
            ✕
          </button>
        </div>

        <form
          id='add-construction-form'
          onSubmit={handleSubmit}
          className='flex-1 overflow-y-auto p-8'>
          {step === 1 ? (
            <div className='space-y-6'>
              <div>
                <label className='text-[10px] font-bold uppercase tracking-widest text-slate-400'>
                  Project Name
                </label>
                <input
                  required
                  type='text'
                  className='mt-1 w-full rounded-xl border border-slate-100 bg-slate-50 p-3 text-sm font-bold text-[#001f3f] outline-none focus:ring-2 focus:ring-blue-500'
                  placeholder='e.g., Harbor Heights Phase II'
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>

              <div className='grid grid-cols-2 gap-4'>
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
                      setFormData({
                        ...formData,
                        permit_number: e.target.value,
                      })
                    }
                  />
                </div>
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

              <div className='space-y-4 rounded-2xl border border-slate-50 bg-slate-50/50 p-4'>
                <div className='grid grid-cols-2 gap-4'>
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
                      {countries.map((c) => (
                        <option key={c.isoCode} value={c.isoCode}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className='text-[10px] font-bold uppercase tracking-widest text-slate-400'>
                      State
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
                      {states.map((s) => (
                        <option key={s.isoCode} value={s.isoCode}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
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
            </div>
          ) : (
            <div className='space-y-6'>
              {formData.phases.map((phase, pIdx) => (
                <div
                  key={pIdx}
                  className='rounded-2xl border border-slate-100 p-6 relative bg-slate-50/30'>
                  <button
                    type='button'
                    onClick={() => removePhase(pIdx)}
                    className='absolute top-4 right-4 text-slate-300 hover:text-red-500'>
                    ✕
                  </button>
                  <div className='mb-4 max-w-sm'>
                    <label className='text-[10px] font-bold uppercase tracking-widest text-slate-400'>
                      Phase Name
                    </label>
                    <input
                      value={phase.label}
                      onChange={(e) => updatePhaseLabel(pIdx, e.target.value)}
                      placeholder='e.g. Structural Work'
                      className='mt-1 w-full rounded-xl border border-slate-200 p-2 text-sm font-bold text-[#001f3f]'
                    />
                  </div>
                  <div className='grid grid-cols-2 gap-3'>
                    {phase.steps.map((step, sIdx) => (
                      <div key={sIdx} className='flex gap-2 items-center group'>
                        <input
                          value={step.text}
                          onChange={(e) =>
                            updateStepText(pIdx, sIdx, e.target.value)
                          }
                          placeholder='Task t'
                          className='flex-1 rounded-lg border border-slate-100 p-2 text-xs font-semibold'
                        />
                        <button
                          type='button'
                          onClick={() => removeStep(pIdx, sIdx)}
                          className='text-slate-300 hover:text-red-500'>
                          ✕
                        </button>
                      </div>
                    ))}
                    <button
                      type='button'
                      onClick={() => addStep(pIdx)}
                      className='flex items-center gap-2 rounded-lg border border-dashed border-slate-300 p-2 text-[10px] font-bold text-slate-400 hover:bg-white'>
                      + Add Task
                    </button>
                  </div>
                </div>
              ))}
              <button
                type='button'
                onClick={addPhase}
                className='w-full rounded-2xl border-2 border-dashed border-slate-200 py-6 flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-[#001f3f]/30 hover:text-[#001f3f] transition-all'>
                <span className='text-xs font-black uppercase tracking-widest'>
                  Add Construction Phase
                </span>
              </button>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className='px-8 py-6 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center'>
          <button
            onClick={onClose}
            className='text-xs font-bold uppercase text-slate-400 hover:text-slate-600'>
            Cancel
          </button>
          <div className='flex gap-3'>
            {step === 2 && (
              <button
                type='button'
                onClick={() => setStep(1)}
                className='rounded-xl border border-slate-200 px-6 py-2 text-xs font-bold text-slate-600'>
                Back
              </button>
            )}
            {step === 1 ? (
              <button
                type='submit'
                form='add-construction-form'
                className='rounded-xl bg-[#001f3f] px-8 py-2 text-xs font-bold text-white'>
                Next: Add Roadmap
              </button>
            ) : (
              <button
                type='submit'
                form='add-construction-form'
                className='rounded-xl bg-[#001f3f] px-8 py-2 text-xs font-bold text-white'>
                Save
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
