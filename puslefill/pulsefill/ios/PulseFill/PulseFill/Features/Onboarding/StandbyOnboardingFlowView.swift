import SwiftUI

/// How onboarding ends after the completion step (both paths mark onboarding finished).
enum StandbyOnboardingFinish {
    /// Dismiss onboarding and land on Profile.
    case landOnProfile
    /// Dismiss onboarding and present `StandbyStatusView` immediately (strong payoff CTA).
    case openStandbyStatus
}

/// First-run standby education + first preference setup.
struct StandbyOnboardingFlowView: View {
    @EnvironmentObject private var env: AppEnvironment

    let onFinish: (StandbyOnboardingFinish) -> Void
    let onDismissed: () -> Void

    @State private var coordinator = StandbyOnboardingCoordinator()
    @State private var activePreferenceCount = 1
    @State private var notificationsEnabled = false

    var body: some View {
        NavigationStack {
            Group {
                switch coordinator.currentStep {
                case .intro:
                    StandbyIntroView(
                        onContinue: { coordinator.goNext() },
                        onSkip: { onDismissed() }
                    )

                case .push:
                    PushValueView(
                        onContinue: {
                            Task { @MainActor in
                                await env.pushRegistrationManager.refreshAuthorizationStatus()
                                notificationsEnabled = env.pushRegistrationManager.isPushAuthorizedForUI
                                coordinator.goNext()
                            }
                        },
                        onSkip: {
                            Task { @MainActor in
                                await env.pushRegistrationManager.refreshAuthorizationStatus()
                                notificationsEnabled = env.pushRegistrationManager.isPushAuthorizedForUI
                                coordinator.goNext()
                            }
                        }
                    )

                case .createPreference:
                    StandbyPreferencesView(
                        api: env.apiClient,
                        onboardingMode: true,
                        onSaved: {
                            Task { @MainActor in
                                await env.pushRegistrationManager.refreshAuthorizationStatus()
                                if let rows = try? await env.apiClient.get(
                                    "/v1/customers/me/preferences",
                                    as: [StandbyPreference].self
                                ) {
                                    activePreferenceCount = max(1, rows.filter(\.active).count)
                                }
                                notificationsEnabled = env.pushRegistrationManager.isPushAuthorizedForUI
                                coordinator.goNext()
                            }
                        },
                        navigationTitleOverride: StandbyOnboardingCopy.Progress.step3
                    )

                case .complete:
                    StandbyOnboardingCompleteView(
                        activePreferenceCount: activePreferenceCount,
                        notificationsEnabled: notificationsEnabled,
                        onViewStatus: {
                            onFinish(.openStandbyStatus)
                        },
                        onDone: {
                            onFinish(.landOnProfile)
                        },
                        onAddAnotherPreference: {
                            coordinator.jumpToAddAnotherPreference()
                        }
                    )
                }
            }
            .navigationTitle(navigationTitle)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    if coordinator.currentStep != .complete {
                        Button("Close") {
                            onDismissed()
                        }
                        .foregroundStyle(PFColor.textSecondary)
                    }
                }
                if coordinator.currentStep == .push || coordinator.currentStep == .createPreference {
                    ToolbarItem(placement: .primaryAction) {
                        Button("Back") {
                            coordinator.goBack()
                        }
                    }
                }
            }
        }
        .tint(PFColor.primary)
        .task {
            await env.pushRegistrationManager.refreshAuthorizationStatus()
            notificationsEnabled = env.pushRegistrationManager.isPushAuthorizedForUI
        }
    }

    private var navigationTitle: String {
        switch coordinator.currentStep {
        case .intro:
            return StandbyOnboardingCopy.Progress.step1
        case .push:
            return StandbyOnboardingCopy.Progress.step2
        case .createPreference:
            return ""
        case .complete:
            return StandbyOnboardingCopy.Progress.step4
        }
    }
}
