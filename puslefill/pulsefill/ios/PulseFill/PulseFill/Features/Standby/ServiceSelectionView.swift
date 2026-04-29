import SwiftUI

struct ServiceSelectionView: View {
    @ObservedObject var viewModel: StandbyPreferencesViewModel

    private var selectedServiceBinding: Binding<String> {
        Binding(
            get: {
                let s = viewModel.draft.serviceId.trimmingCharacters(in: .whitespacesAndNewlines)
                return s.isEmpty ? "any" : s
            },
            set: { newId in
                if newId == "any" {
                    viewModel.draft.serviceId = ""
                } else {
                    viewModel.draft.serviceId = newId
                }
            }
        )
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            PFTypography.section("What appointment do you want sooner?")
            PFTypography.caption(
                "Choose a visit type when your clinic lists services below, or keep “Any service.” Optional location and provider IDs help when your clinic uses them."
            )

            VStack(alignment: .leading, spacing: 10) {
                if viewModel.businessSelectionLocked, viewModel.draft.isBusinessIdValid {
                    VStack(alignment: .leading, spacing: 6) {
                        Text(viewModel.lockedBusinessDisplayName ?? "Your clinic")
                            .font(.system(size: 17, weight: .semibold))
                            .foregroundStyle(PFColor.textPrimary)
                        Text("Clinic is set from your directory selection.")
                            .font(.system(size: 13, weight: .regular))
                            .foregroundStyle(PFColor.textSecondary)
                    }
                    .padding(PFSpacing.md)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(PFSurface.card)
                    .clipShape(RoundedRectangle(cornerRadius: PFRadius.card, style: .continuous))
                } else {
                    TextField("Business ID (required, UUID)", text: $viewModel.draft.businessId)
                        .textContentType(.none)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                        .disabled(viewModel.isEditingExistingPreference)
                        .padding(PFSpacing.md)
                        .background(PFSurface.card)
                        .clipShape(RoundedRectangle(cornerRadius: PFRadius.card, style: .continuous))
                }

                if viewModel.isEditingExistingPreference {
                    Text("Business can’t be changed while editing. Cancel and create a new preference to use a different clinic.")
                        .font(.system(size: 13, weight: .regular))
                        .foregroundStyle(PFColor.textSecondary)
                } else if !viewModel.businessSelectionLocked, !viewModel.draft.businessId.isEmpty, !viewModel.draft.isBusinessIdValid {
                    Text("Enter a valid business UUID from your clinic.")
                        .font(.system(size: 13, weight: .regular))
                        .foregroundStyle(PFColor.error)
                }

                if viewModel.draft.isBusinessIdValid {
                    if viewModel.loadingBusinessServices {
                        HStack(spacing: 10) {
                            ProgressView()
                                .tint(PFColor.primary)
                            Text("Loading services…")
                                .font(.system(size: 14, weight: .regular))
                                .foregroundStyle(PFColor.textSecondary)
                        }
                        .padding(.vertical, 4)
                    }

                    if let err = viewModel.businessServicesError {
                        Text(err)
                            .font(.system(size: 13, weight: .regular))
                            .foregroundStyle(PFColor.error)
                    } else if viewModel.draft.isBusinessIdValid, !viewModel.loadingBusinessServices, viewModel.businessServices.isEmpty {
                        Text("No services are listed for this clinic yet — “Any service” still works.")
                            .font(.system(size: 13, weight: .regular))
                            .foregroundStyle(PFColor.textSecondary)
                    }

                    ServicePickerCardList(
                        services: viewModel.servicePickerOptions(),
                        selectedOptionId: selectedServiceBinding
                    )
                }

                TextField("Location ID (optional)", text: $viewModel.draft.locationId)
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()
                    .padding(PFSpacing.md)
                    .background(PFSurface.card)
                    .clipShape(RoundedRectangle(cornerRadius: PFRadius.card, style: .continuous))

                TextField("Provider ID (optional)", text: $viewModel.draft.providerId)
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()
                    .padding(PFSpacing.md)
                    .background(PFSurface.card)
                    .clipShape(RoundedRectangle(cornerRadius: PFRadius.card, style: .continuous))
            }
        }
    }
}
