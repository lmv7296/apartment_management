import BasicModal from "@/app/components/basic-modal";

export default function AddUnitModal({
  isOpen,
  onClose,
  formData,
  onChangeForm,
  onSubmit,
}) {
  return (
    <BasicModal
      isOpen={isOpen}
      onClose={onClose}
      title='Add Unit'
      description='Create a new unit in this property.'
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
            form='add-unit-form'
            className='rounded-full px-4 py-2 text-sm font-bold text-white'
            style={{
              background:
                "linear-gradient(90deg, var(--accent), var(--primary))",
            }}>
            Create Unit
          </button>
        </>
      }>
      <form
        id='add-unit-form'
        onSubmit={onSubmit}
        className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
        <label className='flex flex-col gap-1 sm:col-span-2'>
          <span className='text-xs font-semibold uppercase app-text-muted'>
            Unit Code
          </span>
          <input
            required
            name='unitCode'
            value={formData.unitCode}
            onChange={onChangeForm}
            placeholder='e.g., 101, A1, Suite B'
            className='rounded-xl border px-3 py-2 outline-none'
            style={{
              borderColor: "var(--border)",
              backgroundColor: "var(--surface-2)",
            }}
          />
        </label>
        <label className='flex flex-col gap-1'>
          <span className='text-xs font-semibold uppercase app-text-muted'>
            Bedrooms
          </span>
          <input
            required
            type='number'
            min='0'
            name='bedrooms'
            value={formData.bedrooms}
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
            Bathrooms
          </span>
          <input
            required
            type='number'
            min='0'
            step='0.5'
            name='bathrooms'
            value={formData.bathrooms}
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
            Area (optional)
          </span>
          <div className='grid grid-cols-[1fr_auto]'>
            <input
              type='number'
              min='0'
              name='squareFeet'
              value={formData.squareFeet}
              onChange={onChangeForm}
              className='rounded-l-xl border border-r-0 px-3 py-2 outline-none'
              style={{
                borderColor: "var(--border)",
                backgroundColor: "var(--surface-2)",
              }}
            />
            <select
              name='areaUnit'
              value={formData.areaUnit || "sqft"}
              onChange={onChangeForm}
              className='rounded-r-xl border px-3 py-2 outline-none'
              style={{
                borderColor: "var(--border)",
                backgroundColor: "var(--surface-2)",
              }}>
              <option value='sqft'>ft2</option>
              <option value='sqm'>m2</option>
            </select>
          </div>
        </label>
      </form>
    </BasicModal>
  );
}
