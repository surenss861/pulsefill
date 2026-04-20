import SwiftUI

struct StandbyPreferencesView: View {
    @EnvironmentObject private var env: AppEnvironment
    @StateObject private var viewModel: StandbyPreferencesViewModel
    @AppStorage("pf.standby.businessId") private var storedBusinessId = ""
    @State private var showSuccess = false
    @State private var deleteTarget: StandbyPreference?

    private let onboardingMode: Bool
    /// Called after a successful **create** (not edit). Used by first-run onboarding to advance the flow.
    private let onSaved: (() -> Void)?
    private let navigationTitleOverride: String?

    init(
        api: APIClient,
        onboardingMode: Bool = false,
        onSaved: (() -> Void)? = nil,
        navigationTitleOverride: String? = nil
    ) {
        self.onboardingMode = onboardingMode
        self.onSaved = onSaved
        self.navigationTitleOverride = navigationTitleOverride
        _viewModel = StateObject(wrappedValue: StandbyPreferencesViewModel(api: api))
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 18) {
                if onboardingMode {
                    onboardingHeader
                } else {
                    StandbyIntroCard()
                }

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

                if onboardingMode {
                    Text(StandbyOnboardingCopy.Preference.businessHelper)
                        .font(.system(size: 13, weight: .regular))
                        .foregroundStyle(PFColor.textSecondary)
                        .frame(maxWidth: .infinity, alignment: .leading)
                }

                ServiceSelectionView(viewModel: viewModel)

                if onboardingMode {
                    Text(StandbyOnboardingCopy.Preference.availabilityHelper)
                        .font(.system(size: 13, weight: .regular))
                        .foregroundStyle(PFColor.textSecondary)
                        .frame(maxWidth: .infinity, alignment: .leading)
                }

                AvailabilitySelectionView(draft: $viewModel.draft)

                if onboardingMode {
                    Text(StandbyOnboardingCopy.Preference.noticeHelper)
                        .font(.system(size: 13, weight: .regular))
                        .foregroundStyle(PFColor.textSecondary)
                        .frame(maxWidth: .infinity, alignment: .leading)
                }

                NoticeWindowSelectionView(draft: $viewModel.draft)
                NotificationPreferenceView(draft: $viewModel.draft)
                StandbyPreferenceReviewCard(draft: viewModel.draft, resolved: viewModel.draftResolvedLabels)

                saveSection

                if !onboardingMode || !viewModel.existingPreferences.isEmpty {
                    savedPreferencesSection
                }
            }
            .padding(.horizontal, 20)
            .padding(.vertical, 20)
        }
        .background(PFColor.background.ignoresSafeArea())
        .navigationTitle(navigationTitleOverride ?? "Standby")
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
                    let hadNoPreferencesBeforeSave = viewModel.existingPreferences.isEmpty
                    let wasEditing = viewModel.isEditingExistingPreference
                    let didSave = await viewModel.savePreference()
                    guard didSave else { return }
                    if !wasEditing, hadNoPreferencesBeforeSave, let onSaved {
                        onSaved()
                    } else {
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
        if viewModel.isEditingExistingPreference {
            return onboardingMode ? StandbyOnboardingCopy.Preference.saveChangesCTA : "Save changes"
        }
        return onboardingMode ? StandbyOnboardingCopy.Preference.saveCTA : "Save standby preference"
    }

    private var onboardingHeader: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(StandbyOnboardingCopy.Preference.heading)
                .font(.system(size: 20, weight: .semibold))
                .foregroundStyle(PFColor.textPrimary)
            Text(StandbyOnboardingCopy.Preference.intro)
                .font(.system(size: 15, weight: .regular))
                .foregroundStyle(PFColor.textSecondary)
                .fixedSize(horizontal: false, vertical: true)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
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
