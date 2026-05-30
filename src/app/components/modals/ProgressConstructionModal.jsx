import BasicModal from "@/app/components/basic-modal";
import React from "react";

export default function ProgressConstructionModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  error,
  phase,
  id,
}) {
  const [currentPhase, setCurrentPhase] = React.useState(phase);

  React.useEffect(() => {
    setCurrentPhase(phase);
  }, [phase]);

  const handleStepChange = (stepIndex) => {
    if (!currentPhase) return;

    const updatedPhase = { ...currentPhase };
    const steps = updatedPhase.PhaseSteps || updatedPhase.steps || [];
    const step = { ...steps[stepIndex] };

    step.completed = !step.completed;
    steps[stepIndex] = step;

    // Recalculate phase progress based on completed steps
    const totalSteps = steps.length;
    const completedSteps = steps.filter((s) => s.completed).length;
    updatedPhase.progress =
      totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

    setCurrentPhase(updatedPhase);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (typeof onSubmit === "function") {
      const success = await onSubmit(currentPhase);
      // Close modal only if update was successful
      if (success) onClose();
    } else {
      console.error("onSubmit prop is missing or not a function");
    }
  };

  return (
    <BasicModal
      isOpen={isOpen}
      onClose={onClose}
      title='Update Construction Progress'
      description='Mark steps as complete and update phase progress.'
      footer={
        <>
          <button
            type='button'
            onClick={onClose}
            className='rounded-full border px-4 py-2 text-sm font-semibold'
            style={{
              borderColor: "var(--border)",
              color: "var(--text)",
            }}>
            Cancel
          </button>
          <button
            type='submit'
            form='update-progress-form'
            className='rounded-full px-4 py-2 text-sm font-bold text-white'
            style={{
              background:
                "linear-gradient(90deg, var(--accent), var(--primary))",
            }}
            disabled={isSubmitting}>
            {isSubmitting ? "Updating..." : "Save Progress"}
          </button>
        </>
      }>
      <form
        id='update-progress-form'
        onSubmit={handleSubmit}
        className='space-y-4'>
        {error && <p className='text-red-500 text-sm mb-4'>{error}</p>}
        {currentPhase && (
          <div className='border p-4 rounded-lg'>
            <h3 className='font-bold text-lg mb-2'>
              {currentPhase.label} ({currentPhase.progress}%)
            </h3>
            <ul className='space-y-2'>
              {(currentPhase.PhaseSteps || currentPhase.steps)?.map(
                (step, stepIndex) => (
                  <li key={stepIndex} className='flex items-center gap-2'>
                    <input
                      type='checkbox'
                      checked={step.completed}
                      onChange={() => handleStepChange(stepIndex)}
                      className='form-checkbox h-4 w-4 text-[#001f3f] rounded'
                    />
                    <span
                      className={
                        step.completed
                          ? "line-through text-slate-500"
                          : "text-slate-700"
                      }>
                      {step.text}
                    </span>
                  </li>
                ),
              )}
            </ul>
          </div>
        )}
      </form>
    </BasicModal>
  );
}
