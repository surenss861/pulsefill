import SwiftUI

struct ServiceSelectionView: View {
    @ObservedObject var viewModel: StandbyPreferencesViewModel
    @State private var showAdvancedOptions = false

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
        PFCustomerSectionCard(variant: .default, padding: 18) {
            VStack(alignment: .leading, spacing: 14) {
                Text("Which openings do you want?")
                    .font(.system(size: 17, weight: .bold))
                    .foregroundStyle(PFColor.textPrimary)

                Text("Choose the services you want to hear about when times become available.")
                    .font(.system(size: 15, weight: .medium))
                    .foregroundStyle(PFColor.textSecondary)
                    .lineSpacing(3)

                if !viewModel.businessSelectionLocked {
                    if !viewModel.draft.isBusinessIdValid, viewModel.draft.trimmedBusinessId.isEmpty {
                        Text(StandbySetupCustomerCopy.businessMissingBody)
                            .font(.system(size: 14, weight: .medium))
                            .foregroundStyle(PFColor.textMuted)
                            .lineSpacing(3)
                    }

                    TextField("Business identifier from your clinic", text: $viewModel.draft.businessId)
                        .textContentType(.none)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                        .disabled(viewModel.isEditingExistingPreference)
                        .font(.system(size: 15, weight: .medium))
                        .padding(12)
                        .background(
                            RoundedRectangle(cornerRadius: 12, style: .continuous)
                                .fill(PFColor.customerCard)
                        )
                        .overlay(
                            RoundedRectangle(cornerRadius: 12, style: .continuous)
                                .stroke(PFColor.hairline, lineWidth: 1)
                        )

                    if viewModel.isEditingExistingPreference {
                        Text("Business can’t be changed while you’re editing. Cancel to start a new preference for a different business.")
                            .font(.system(size: 13, weight: .medium))
                            .foregroundStyle(PFColor.textSecondary)
                            .lineSpacing(3)
                    } else if !viewModel.draft.businessId.isEmpty, !viewModel.draft.isBusinessIdValid {
                        Text(StandbySetupCustomerCopy.businessIdInvalid)
                            .font(.system(size: 13, weight: .medium))
                            .foregroundStyle(PFColor.error)
                    }
                }

                if viewModel.draft.isBusinessIdValid {
                    if viewModel.loadingBusinessServices {
                        PFCustomerLoadingState(
                            title: "Loading services…",
                            message: "Getting the list from this business.",
                            compact: true
                        )
                    }

                    if let err = viewModel.businessServicesError {
                        Text(PFCustomerFacingErrorCopy.sanitizeCustomerMessage(err))
                            .font(.system(size: 14, weight: .medium))
                            .foregroundStyle(PFColor.error)
                            .lineSpacing(3)
                    } else if viewModel.draft.isBusinessIdValid, !viewModel.loadingBusinessServices, viewModel.businessServices.isEmpty {
                        VStack(alignment: .leading, spacing: 6) {
                            Text(StandbySetupCustomerCopy.servicesEmpty)
                                .font(.system(size: 15, weight: .semibold))
                                .foregroundStyle(PFColor.textPrimary)
                            Text(StandbySetupCustomerCopy.servicesEmptyBody)
                                .font(.system(size: 14, weight: .medium))
                                .foregroundStyle(PFColor.textSecondary)
                                .lineSpacing(3)
                        }
                    }

                    ServicePickerCardList(
                        services: viewModel.servicePickerOptions(),
                        selectedOptionId: selectedServiceBinding
                    )
                }

                DisclosureGroup(isExpanded: $showAdvancedOptions) {
                    VStack(alignment: .leading, spacing: 12) {
                        TextField(StandbySetupCustomerCopy.locationFieldLabel, text: $viewModel.draft.locationId)
                            .textInputAutocapitalization(.never)
                            .autocorrectionDisabled()
                            .font(.system(size: 15, weight: .medium))
                            .padding(12)
                            .background(
                                RoundedRectangle(cornerRadius: 12, style: .continuous)
                                    .fill(PFColor.customerCard)
                            )
                            .overlay(
                                RoundedRectangle(cornerRadius: 12, style: .continuous)
                                    .stroke(PFColor.hairline, lineWidth: 1)
                            )

                        TextField(StandbySetupCustomerCopy.providerFieldLabel, text: $viewModel.draft.providerId)
                            .textInputAutocapitalization(.never)
                            .autocorrectionDisabled()
                            .font(.system(size: 15, weight: .medium))
                            .padding(12)
                            .background(
                                RoundedRectangle(cornerRadius: 12, style: .continuous)
                                    .fill(PFColor.customerCard)
                            )
                            .overlay(
                                RoundedRectangle(cornerRadius: 12, style: .continuous)
                                    .stroke(PFColor.hairline, lineWidth: 1)
                            )
                    }
                    .padding(.top, 6)
                } label: {
                    VStack(alignment: .leading, spacing: 4) {
                        Text(StandbySetupCustomerCopy.advancedOptionsTitle)
                            .font(.system(size: 15, weight: .semibold))
                            .foregroundStyle(PFColor.textPrimary)
                        Text(StandbySetupCustomerCopy.advancedOptionsCaption)
                            .font(.system(size: 13, weight: .medium))
                            .foregroundStyle(PFColor.textMuted)
                            .lineSpacing(2)
                    }
                }
                .tint(PFColor.ember)
            }
        }
    }
}
