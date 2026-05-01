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
    private let initialBusinessId: String?
    private let initialBusinessDisplayName: String?
    private let initialServiceId: String?
    private let lockBusinessSelection: Bool

    init(
        api: APIClient,
        onboardingMode: Bool = false,
        onSaved: (() -> Void)? = nil,
        navigationTitleOverride: String? = nil,
        initialBusinessId: String? = nil,
        initialBusinessDisplayName: String? = nil,
        initialServiceId: String? = nil,
        lockBusinessSelection: Bool = false
    ) {
        self.onboardingMode = onboardingMode
        self.onSaved = onSaved
        self.navigationTitleOverride = navigationTitleOverride
        self.initialBusinessId = initialBusinessId
        self.initialBusinessDisplayName = initialBusinessDisplayName
        self.initialServiceId = initialServiceId
        self.lockBusinessSelection = lockBusinessSelection
        _viewModel = StateObject(
            wrappedValue: StandbyPreferencesViewModel(
                api: api,
                initialBusinessId: initialBusinessId,
                initialBusinessDisplayName: initialBusinessDisplayName,
                initialServiceId: initialServiceId,
                lockBusinessSelection: lockBusinessSelection
            )
        )
    }

    private var navigationTitleText: String {
        if onboardingMode {
            return navigationTitleOverride ?? "Standby"
        }
        if viewModel.isEditingExistingPreference {
            return "Edit standby"
        }
        if viewModel.businessSelectionLocked {
            return "Set up standby"
        }
        return navigationTitleOverride ?? "Standby preferences"
    }

    private var customerSubtitle: String? {
        guard !onboardingMode else { return nil }
        if viewModel.isEditingExistingPreference {
            return StandbySetupCustomerCopy.subtitleEdit
        }
        if viewModel.businessSelectionLocked {
            return StandbySetupCustomerCopy.subtitleSetupLocked
        }
        return StandbySetupCustomerCopy.subtitleSetupOpen
    }

    var body: some View {
        ZStack {
            PFScreenBackground()

            ScrollView {
                VStack(spacing: 20) {
                    if onboardingMode {
                        onboardingHeader
                    } else {
                        customerFlowHeader
                    }

                    if viewModel.isEditingExistingPreference {
                        PFCustomerSectionCard(variant: .attention, padding: 14) {
                            HStack(alignment: .center, spacing: 12) {
                                Text("You’re editing a saved preference")
                                    .font(.system(size: 15, weight: .semibold))
                                    .foregroundStyle(PFColor.textPrimary)
                                Spacer(minLength: 0)
                                Button("Cancel") {
                                    viewModel.cancelEditing()
                                }
                                .font(.system(size: 15, weight: .semibold))
                                .foregroundStyle(PFColor.ember)
                            }
                        }
                    }

                    if onboardingMode {
                        Text(StandbyOnboardingCopy.Preference.businessHelper)
                            .font(.system(size: 13, weight: .regular))
                            .foregroundStyle(PFColor.textSecondary)
                            .frame(maxWidth: .infinity, alignment: .leading)
                    }

                    if !onboardingMode, viewModel.businessSelectionLocked, viewModel.draft.isBusinessIdValid {
                        lockedBusinessContextCard
                    }

                    if !onboardingMode, !viewModel.businessSelectionLocked {
                        StandbyIntroCard()
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
        }
        .navigationTitle(navigationTitleText)
        .navigationBarTitleDisplayMode(.inline)
        .toolbarBackground(PFColor.customerTabBar, for: .navigationBar)
        .toolbarColorScheme(.dark, for: .navigationBar)
        .tint(PFColor.ember)
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
            StandbySuccessView(
                wantsPushReminders: viewModel.draft.wantsPushReminders,
                showOpeningsCTA: !onboardingMode,
                onDone: {
                    viewModel.resetDraftAfterSuccess(keepingBusinessId: true)
                    showSuccess = false
                },
                onViewOpenings: !onboardingMode
                    ? {
                        viewModel.resetDraftAfterSuccess(keepingBusinessId: true)
                        showSuccess = false
                        env.customerNavigation.openOffersInbox()
                    }
                    : nil
            )
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

    private var customerFlowHeader: some View {
        VStack(alignment: .leading, spacing: 8) {
            if let customerSubtitle {
                PFTypography.Customer.screenLead(customerSubtitle)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private var lockedBusinessContextCard: some View {
        PFCustomerSectionCard(variant: .elevated, padding: 18) {
            VStack(alignment: .leading, spacing: 8) {
                PFTypography.Customer.label("Business")
                Text(viewModel.lockedBusinessDisplayName ?? "This business")
                    .font(.system(size: 20, weight: .bold))
                    .foregroundStyle(PFColor.textPrimary)
                Text("You’re setting standby preferences for this business.")
                    .font(.system(size: 15, weight: .medium))
                    .foregroundStyle(PFColor.textSecondary)
                    .lineSpacing(3)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    @ViewBuilder
    private var saveSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            if case let .failed(message) = viewModel.saveState {
                Text(PFCustomerFacingErrorCopy.sanitizeCustomerMessage(message))
                    .font(.system(size: 14, weight: .medium))
                    .foregroundStyle(PFColor.error)
                    .lineSpacing(3)
            }

            if let err = viewModel.actionError {
                Text(PFCustomerFacingErrorCopy.sanitizeCustomerMessage(err))
                    .font(.system(size: 14, weight: .medium))
                    .foregroundStyle(PFColor.error)
                    .lineSpacing(3)
            }

            PFCustomerPrimaryButton(
                title: saveButtonTitle,
                isEnabled: viewModel.draft.canReview,
                isLoading: isSaving,
                onDisabledTap: nil,
                action: {
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
                }
            )
        }
    }

    private var isSaving: Bool {
        if case .saving = viewModel.saveState { return true }
        return false
    }

    private var saveButtonTitle: String {
        if isSaving { return "Saving…" }
        if onboardingMode {
            return viewModel.isEditingExistingPreference
                ? StandbyOnboardingCopy.Preference.saveChangesCTA
                : StandbyOnboardingCopy.Preference.saveCTA
        }
        return viewModel.isEditingExistingPreference
            ? StandbySetupCustomerCopy.savePrimaryEdit
            : StandbySetupCustomerCopy.savePrimaryNew
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
            Text("Your standby preferences")
                .font(.system(size: 17, weight: .bold))
                .foregroundStyle(PFColor.textPrimary)

            if viewModel.loadingExisting {
                PFCustomerLoadingState(
                    title: "Loading preferences…",
                    message: "Getting your saved standby setups.",
                    compact: true
                )
            } else if let loadError = viewModel.loadError {
                Text(PFCustomerFacingErrorCopy.sanitizeCustomerMessage(loadError))
                    .font(.system(size: 14, weight: .medium))
                    .foregroundStyle(PFColor.error)
            } else if viewModel.existingPreferences.isEmpty {
                Text("Once you save, your preferences appear here so you can pause or remove them later.")
                    .font(.system(size: 14, weight: .medium))
                    .foregroundStyle(PFColor.textSecondary)
                    .lineSpacing(3)
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
