import Foundation
import Observation

@Observable
@MainActor
final class StandbyOnboardingCoordinator {
    var currentStep: StandbyOnboardingStep = .intro

    func goNext() {
        switch currentStep {
        case .intro:
            currentStep = .push
        case .push:
            currentStep = .createPreference
        case .createPreference:
            currentStep = .complete
        case .complete:
            break
        }
    }

    func goBack() {
        switch currentStep {
        case .intro:
            break
        case .push:
            currentStep = .intro
        case .createPreference:
            currentStep = .push
        case .complete:
            currentStep = .createPreference
        }
    }

    func jumpToAddAnotherPreference() {
        currentStep = .createPreference
    }

    func resetForNewSession() {
        currentStep = .intro
    }
}
