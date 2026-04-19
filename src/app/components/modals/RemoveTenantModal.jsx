import BasicModal from "@/app/components/basic-modal";

export default function RemoveTenantModal({
  isOpen,
  onClose,
  activeUnit,
  formData,
  onChangeForm,
  onSubmit,
}) {
  return (
    <BasicModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Remove Tenant ${activeUnit?.unitCode ? `- ${activeUnit.unitCode}` : ""}`}
      description='Record move-out details before ending the lease.'
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
            form='remove-tenant-form'
            className='rounded-full px-4 py-2 text-sm font-bold text-white'
            style={{ backgroundColor: "var(--danger, #dc2626)" }}>
            Confirm Removal
          </button>
        </>
      }>
      <form
        id='remove-tenant-form'
        onSubmit={onSubmit}
        className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
        <label className='flex flex-col gap-1'>
          <span className='text-xs font-semibold uppercase app-text-muted'>
            Leave Date
          </span>
          <input
            required
            type='date'
            name='leaveDate'
            value={formData.leaveDate}
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
            Deposit Return
          </span>
          <input
            type='number'
            min='0'
            step='0.01'
            name='depositReturnAmount'
            value={formData.depositReturnAmount}
            onChange={onChangeForm}
            className='rounded-xl border px-3 py-2 outline-none'
            style={{
              borderColor: "var(--border)",
              backgroundColor: "var(--surface-2)",
            }}
          />
        </label>
        <label className='flex flex-col gap-1 sm:col-span-2'>
          <span className='text-xs font-semibold uppercase app-text-muted'>
            Forwarding Address
          </span>
          <input
            name='forwardingAddress'
            value={formData.forwardingAddress}
            onChange={onChangeForm}
            className='rounded-xl border px-3 py-2 outline-none'
            style={{
              borderColor: "var(--border)",
              backgroundColor: "var(--surface-2)",
            }}
          />
        </label>
        <label className='flex flex-col gap-1 sm:col-span-2'>
          <span className='text-xs font-semibold uppercase app-text-muted'>
            Reason
          </span>
          <input
            name='reason'
            value={formData.reason}
            onChange={onChangeForm}
            className='rounded-xl border px-3 py-2 outline-none'
            style={{
              borderColor: "var(--border)",
              backgroundColor: "var(--surface-2)",
            }}
          />
        </label>
        <label className='flex flex-col gap-1 sm:col-span-2'>
          <span className='text-xs font-semibold uppercase app-text-muted'>
            Notes
          </span>
          <textarea
            name='notes'
            rows={3}
            value={formData.notes}
            onChange={onChangeForm}
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
