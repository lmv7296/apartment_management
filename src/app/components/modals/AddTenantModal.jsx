import BasicModal from "@/app/components/basic-modal";
import userPreferences from "@/config/user-preferences.json";

export default function AddTenantModal({
  isOpen,
  onClose,
  activeUnit,
  formData,
  onChangeForm,
  onSubmit,
  userCurrency,
}) {
  const effectiveCurrency = formData.currency || userCurrency || "USD";

  return (
    <BasicModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Add Tenant ${activeUnit?.unitCode ? `- ${activeUnit.unitCode}` : ""}`}
      description='Capture basic tenant details before creating a lease.'
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
            form='add-tenant-form'
            className='rounded-full px-4 py-2 text-sm font-bold text-white'
            style={{
              background:
                "linear-gradient(90deg, var(--accent), var(--primary))",
            }}>
            Save Tenant
          </button>
        </>
      }>
      <form
        id='add-tenant-form'
        onSubmit={onSubmit}
        className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
        <label className='flex flex-col gap-1 sm:col-span-2'>
          <span className='text-xs font-semibold uppercase app-text-muted'>
            Full Name
          </span>
          <input
            required
            name='fullName'
            value={formData.fullName}
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
            Email
          </span>
          <input
            required
            type='email'
            name='email'
            value={formData.email}
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
            Phone
          </span>
          <input
            required
            name='phone'
            value={formData.phone}
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
            Lease Start
          </span>
          <input
            required
            type='date'
            name='startDate'
            value={formData.startDate}
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
            Lease End
          </span>
          <input
            required
            type='date'
            name='endDate'
            value={formData.endDate}
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
            Monthly Rent
          </span>
          <div className='grid grid-cols-[1fr_auto]'>
            <input
              required
              type='number'
              min='0'
              step='0.01'
              name='monthlyRent'
              value={formData.monthlyRent}
              onChange={onChangeForm}
              placeholder='0.00'
              className='rounded-l-xl border border-r-0 px-3 py-2 text-sm outline-none'
              style={{
                borderColor: "var(--border)",
                backgroundColor: "var(--surface-2)",
              }}
            />
            <select
              required
              name='currency'
              value={effectiveCurrency}
              onChange={onChangeForm}
              className='rounded-r-xl border px-3 py-2 outline-none'
              style={{
                borderColor: "var(--border)",
                backgroundColor: "var(--surface-2)",
              }}>
              {userPreferences.currencies.map((curr) => (
                <option key={curr.code} value={curr.code}>
                  {curr.code}
                </option>
              ))}
            </select>
          </div>
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
