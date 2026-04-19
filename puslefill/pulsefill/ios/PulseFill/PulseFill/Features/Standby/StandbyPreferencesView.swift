import SwiftUI

struct StandbyPreferencesView: View {
    @EnvironmentObject private var env: AppEnvironment
    @StateObject private var viewModel: StandbyPreferencesViewModel
    @AppStorage("pf.standby.businessId") private var storedBusinessId = ""
    @State private var showSuccess = false
    @State private var deleteTarget: StandbyPreference?

    init(api: APIClient) {
        _viewModel = StateObject(wrappedValue: StandbyPreferencesViewModel(api: api))
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 18) {
                StandbyIntroCard()

                if viewModel.isEditingExistingPreference {
                    HStack(alignment: .center, spacing: 12) {
                        Text("Editing saved preference")
                            .font(.system(size: 15, weight: .semibold))
                            .foregroundStyle(PFColor.textPrimary)
                        Spacer(minLength: 0)
                        Button("Cancel") {
                            viewModel.cancelEditing()
                        }
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundStyle(PFColor.primary)
                    }
                    .padding(PFSpacing.md)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(PFColor.primary.opacity(0.10))
                    .clipShape(RoundedRectangle(cornerRadius: PFRadius.card, style: .continuous))
                    .overlay(
                        RoundedRectangle(cornerRadius: PFRadius.card, style: .continuous)
                            .strokeBorder(PFColor.primary.opacity(0.25), lineWidth: 1)
                    )
                }

                ServiceSelectionView(viewModel: viewModel)
                AvailabilitySelectionView(draft: $viewModel.draft)
                NoticeWindowSelectionView(draft: $viewModel.draft)
                NotificationPreferenceView(draft: $viewModel.draft)
                StandbyPreferenceReviewCard(draft: viewModel.draft, resolved: viewModel.draftResolvedLabels)

                saveSection

                savedPreferencesSection
            }
            .padding(.horizontal, 20)
            .padding(.vertical, 20)
        }
        .background(PFColor.background.ignoresSafeArea())
        .navigationTitle("Standby")
        .navigationBarTitleDisplayMode(.inline)
        .task {
            await viewModel.loadExistingPreferences()
            await viewModel.handleBusinessIdentifierChange()
        }
        .onAppear {
            if viewModel.draft.businessId.isEmpty, !storedBusinessId.isEmpty {
                viewModel.draft.businessId = storedBusinessId
            }
            Task { await viewModel.handleBusinessIdentifierChange() }
        }
        .onChange(of: viewModel.draft.businessId) { _, newValue in
            let t = newValue.trimmingCharacters(in: .whitespacesAndNewlines)
            if UUID(uuidString: t) != nil {
                storedBusinessId = t
            }
            Task { await viewModel.handleBusinessIdentifierChange() }
        }
        .onChange(of: viewModel.draft.serviceId) { _, _ in
            Task { await viewModel.refreshDraftLabels() }
        }
        .sheet(isPresented: $showSuccess) {
            StandbySuccessView(wantsPushReminders: viewModel.draft.wantsPushReminders) {
                viewModel.resetDraftAfterSuccess(keepingBusinessId: true)
                showSuccess = false
            }
            .environmentObject(env)
        }
        .alert("Delete standby preference?", isPresented: Binding(
            get: { deleteTarget != nil },
            set: { if !$0 { deleteTarget = nil } }
        )) {
            Button("Delete", role: .destructive) {
                if let id = deleteTarget?.id {
                    Task { await viewModel.deletePreference(id) }
                }
                deleteTarget = nil
            }
            Button("Cancel", role: .cancel) {
                deleteTarget = nil
            }
        } message: {
            Text("This can’t be undone.")
        }
    }

    @ViewBuilder
    private var saveSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            if case let .failed(message) = viewModel.saveState {
                Text(message)
                    .font(.system(size: 13))
                    .foregroundStyle(PFColor.error)
            }

            if let err = viewModel.actionError {
                Text(err)
                    .font(.system(size: 13))
                    .foregroundStyle(PFColor.error)
            }

            Button {
                Task {
                    await viewModel.savePreference()
                    if case .saved = viewModel.saveState {
                        showSuccess = true
                    }
                }
            } label: {
                HStack {
                    if case .saving = viewModel.saveState {
                        ProgressView()
                            .tint(PFColor.background)
                    }
                    Text(saveButtonTitle)
                        .frame(maxWidth: .infinity)
                }
            }
            .buttonStyle(PFPrimaryButtonStyle())
            .disabled(!viewModel.draft.canReview || isSaving)
        }
    }

    private var isSaving: Bool {
        if case .saving = viewModel.saveState { return true }
        return false
    }

    private var saveButtonTitle: String {
        if isSaving { return "Saving…" }
        return viewModel.isEditingExistingPreference ? "Save changes" : "Save standby preference"
    }

    @ViewBuilder
    private var savedPreferencesSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            SectionHeaderView(title: "Your standby preferences")

            if viewModel.loadingExisting {
                ProgressView()
                    .tint(PFColor.primary)
                    .frame(maxWidth: .infinity)
                    .padding(.top, 8)
            } else if let loadError = viewModel.loadError {
                Text(loadError)
                    .font(.system(size: 13))
                    .foregroundStyle(PFColor.error)
            } else if viewModel.existingPreferences.isEmpty {
                Text("Once you save, your preferences appear here so you can pause or remove them later.")
                    .font(.system(size: 13))
                    .foregroundStyle(PFColor.textSecondary)
                    .padding(.top, 4)
            } else {
                VStack(spacing: 12) {
                    ForEach(viewModel.existingPreferences) { item in
                        SavedStandbyPreferenceCard(
                            preference: item,
                            resolved: viewModel.savedResolvedLabels[item.id],
                            onEdit: {
                                viewModel.beginEditing(item)
                            },
                            onToggleActive: {
                                Task { await viewModel.setActive(item.id, active: !item.active) }
                            },
                            onDelete: {
                                deleteTarget = item
                            }
                        )
                    }
                }
            }
        }
        .padding(.top, 10)
    }
}
