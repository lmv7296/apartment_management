import React from "react";
import BasicModal from "@/app/components/basic-modal";

export default function ExtendLeaseModal({
  isOpen,
  onClose,
  currentEndDate,
  onSubmit,
}) {
  const [newEndDate, setNewEndDate] = React.useState(currentEndDate || "");

  React.useEffect(() => {
    setNewEndDate(currentEndDate || "");
  }, [currentEndDate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (typeof onSubmit === "function") {
      try {
        await onSubmit(newEndDate);
      } catch (err) {
        console.error("Form submission error:", err);
      }
    } else {
      console.error("onSubmit is not a function", onSubmit);
    }
  };

  return (
    <BasicModal
      isOpen={isOpen}
      onClose={onClose}
      title='Extend Lease'
      description='Update the expiration date for the current lease.'
      footer={
        <>
          <button
            type='button'
            onClick={() => {
              if (onClose && typeof onClose === "function") {
                onClose();
              }
            }}
            className='rounded-full border px-4 py-2 text-sm font-semibold'
            style={{
              borderColor: "var(--border)",
              color: "var(--text)",
            }}>
            Cancel
          </button>
          <button
            type='submit'
            form='extend-lease-form'
            className='rounded-full px-4 py-2 text-sm font-bold text-white'
            style={{
              background:
                "linear-gradient(90deg, var(--accent), var(--primary))",
            }}>
            Extend Lease
          </button>
        </>
      }>
      <form
        id='extend-lease-form'
        onSubmit={handleSubmit}
        className='grid grid-cols-1 gap-3'>
        <label className='flex flex-col gap-1'>
          <span className='text-xs font-semibold uppercase app-text-muted'>
            New Expiration Date
          </span>
          <input
            required
            type='date'
            value={newEndDate}
            onChange={(e) => setNewEndDate(e.target.value)}
            min={currentEndDate} // Prevent setting date before current end date
            className='rounded-xl border px-3 py-2 outline-none'
            style={{
              borderColor: "var(--border)",
              backgroundColor: "var(--surface-2)",
            }}
          />
        </label>
      </form>
    </BasicModal>
  );
}
