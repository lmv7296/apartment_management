"use client";

import React from "react";
import AddTenantModal from "@/app/components/modals/AddTenantModal";
import RemoveTenantModal from "@/app/components/modals/RemoveTenantModal";
import AddUnitModal from "@/app/components/modals/AddUnitModal";

/**
 * PropertyModalsContainer
 * Wrapper component for Property details modals (Add Tenant, Remove Tenant, Add Unit).
 * Each modal reuses BasicModal under the hood.
 *
 * Props:
 * - modalMode: "add" | "remove" | "addUnit" | ""
 * - activeUnit: Current selected unit object (for add/remove tenant)
 * - onClose: Function to close the active modal
 * - formData: Form state object { add: {}, remove: {}, addUnit: {} }
 * - onChangeForm: Form input change handler
 * - onSubmitForm: Form submit handler
 * - userCurrency: Default currency preference
 */
export default function PropertyModalsContainer({
  modalMode,
  onClose,
  activeUnit,
  formData = {},
  onChangeForm,
  onSubmitForm,
  userCurrency,
}) {
  return (
    <>
      <AddTenantModal
        isOpen={modalMode === "add"}
        onClose={onClose}
        activeUnit={activeUnit}
        formData={formData.add || {}}
        onChangeForm={onChangeForm}
        onSubmit={onSubmitForm}
        userCurrency={userCurrency}
      />

      <RemoveTenantModal
        isOpen={modalMode === "remove"}
        onClose={onClose}
        activeUnit={activeUnit}
        formData={formData.remove || {}}
        onChangeForm={onChangeForm}
        onSubmit={onSubmitForm}
      />

      <AddUnitModal
        isOpen={modalMode === "addUnit"}
        onClose={onClose}
        formData={formData.addUnit || {}}
        onChangeForm={onChangeForm}
        onSubmit={onSubmitForm}
      />
    </>
  );
}
