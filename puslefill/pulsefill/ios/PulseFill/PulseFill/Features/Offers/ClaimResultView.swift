import SwiftUI

struct ClaimResultViewModel: Identifiable, Hashable {
    enum Outcome: Hashable {
        case success(claimId: String?)
        case failed(String)
    }

    let id = UUID()
    let outcome: Outcome

    init(outcome: Outcome) {
        self.outcome = outcome
    }

    var isSuccess: Bool {
        if case .success = outcome { return true }
        return false
    }

    var title: String {
        switch outcome {
        case .success: return "You got it"
        case .failed: return "Couldn’t claim this opening"
        }
    }

    var subtitle: String {
        switch outcome {
        case let .success(claimId):
            if let claimId, !claimId.isEmpty {
                return "Your claim was accepted. Reference \(claimId.prefix(8))… — check Activity to track it."
            }
            return "Your claim was accepted. Check Activity to track it."
        case let .failed(message):
            return message
        }
    }
}

struct ClaimResultView: View {
    @EnvironmentObject private var env: AppEnvironment
    @Environment(\.dismiss) private var dismiss

    let viewModel: ClaimResultViewModel

    var body: some View {
        VStack(spacing: PFSpacing.lg) {
            Spacer()

            VStack(spacing: PFSpacing.md) {
                Image(systemName: viewModel.isSuccess ? "checkmark.circle.fill" : "xmark.circle.fill")
                    .font(.system(size: 54, weight: .semibold))
                    .foregroundStyle(viewModel.isSuccess ? PFColor.success : PFColor.error)

                PFTypography.title(viewModel.title)
                    .foregroundStyle(PFColor.textPrimary)
                    .multilineTextAlignment(.center)

                PFTypography.body(viewModel.subtitle)
                    .foregroundStyle(PFColor.textSecondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, PFSpacing.lg)
            }
            .appearUp()

            Spacer()

            VStack(spacing: PFSpacing.md) {
                if viewModel.isSuccess {
                    Button {
                        env.navigationRouter.selectedTab = .activity
                        dismiss()
                    } label: {
                        Text("View activity")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(PFPrimaryButtonStyle())
                }

                Button {
                    dismiss()
                } label: {
                    Text(viewModel.isSuccess ? "Done" : "Back to offer")
                        .frame(maxWidth: .infinity)
                }
                .foregroundStyle(PFColor.textSecondary)
            }
            .padding(.horizontal, PFSpacing.lg)
        }
        .padding(.bottom, PFSpacing.xl)
        .background(PFColor.background.ignoresSafeArea())
        .navigationBarBackButtonHidden(true)
    }
}
