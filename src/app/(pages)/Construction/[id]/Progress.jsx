import React from "react";
import ProgressConstructionModal from "../../../components/modals/ProgressConstructionModal";

export default function Progress({ project, error, onSubmit, isSubmitting }) {
  const [isModalOpen, setModalOpen] = React.useState(false);
  const [activePhase, setActivePhase] = React.useState(null);

  const handleOpenModal = (phase) => {
    setActivePhase(phase);
    setModalOpen(true);
  };

  const handleModalSubmit = async (updatedPhase) => {
    if (!onSubmit) return;

    // Merge the updated phase back into the project's phases array
    const updatedPhases = project.phases.map((p) =>
      p.label === updatedPhase.label ? updatedPhase : p,
    );

    return await onSubmit(project.id, updatedPhases);
  };

  return (
    <div className='grid grid-cols-2 gap-4 md:grid-cols-4'>
      <ProgressConstructionModal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        error={error}
        phase={activePhase}
        onSubmit={handleModalSubmit}
        isSubmitting={isSubmitting}
      />
      {project.phases?.map((phase) => (
        <div
          key={phase.label}
          className='rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all hover:border-slate-300 hover:shadow-md'>
          <button onClick={() => handleOpenModal(phase)}>
            <span className='text-[10px] font-bold uppercase tracking-wider text-slate-400'>
              {phase.label}
            </span>
            <div className='my-2 flex items-center justify-between'>
              <span className='text-xl font-black text-[#001f3f]'>
                {phase.progress}%
              </span>
              {phase.progress === 100 && (
                <span className='text-emerald-500'>
                  <svg
                    xmlns='http://www.w3.org/2000/svg'
                    width='18'
                    height='18'
                    viewBox='0 0 24 24'
                    fill='none'
                    stroke='currentColor'
                    strokeWidth='3'
                    strokeLinecap='round'
                    strokeLinejoin='round'>
                    <path d='M20 6 9 17l-5-5' />
                  </svg>
                </span>
              )}
            </div>
            <div className='h-1.5 w-full rounded-full bg-slate-100'>
              <div
                className='h-full rounded-full bg-[#001f3f]'
                style={{ width: `${phase.progress}%` }}
              />
            </div>

            {/* Visualization for PhaseSteps */}
            {(phase.steps || phase.PhaseSteps) && (
              <div className='mt-4 space-y-1.5 border-t border-slate-50 pt-3 text-left'>
                {(phase.steps || phase.PhaseSteps).map((step, idx) => (
                  <div key={idx} className='flex items-center gap-2'>
                    <div
                      className={`h-1.5 w-1.5 rounded-full ${step.completed ? "bg-emerald-500" : "bg-slate-300"}`}
                    />
                    <span
                      className={`text-[10px] font-medium leading-tight ${step.completed ? "text-slate-400 line-through" : "text-slate-500"}`}>
                      {step.text}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </button>
        </div>
      ))}
    </div>
  );
}
