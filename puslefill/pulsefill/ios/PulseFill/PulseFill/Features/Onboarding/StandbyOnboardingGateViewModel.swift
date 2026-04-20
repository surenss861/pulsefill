import Foundation
import Observation

@Observable
@MainActor
final class StandbyOnboardingGateViewModel {
    var shouldShowOnboarding = false
    var isLoading = true

    private let api: APIClient

    init(api: APIClient) {
        self.api = api
    }

    func load(
        onboardingCompleted: Bool,
        onboardingDismissed: Bool
    ) async {
        isLoading = true
        defer { isLoading = false }

        guard !onboardingCompleted, !onboardingDismissed else {
            shouldShowOnboarding = false
            return
        }

        do {
            let status = try await api.getStandbyStatus(pushPermissionStatus: nil)
            let total = status.summary.activePreferences + status.summary.pausedPreferences
            shouldShowOnboarding = total == 0
        } catch {
            shouldShowOnboarding = false
        }
    }
}
