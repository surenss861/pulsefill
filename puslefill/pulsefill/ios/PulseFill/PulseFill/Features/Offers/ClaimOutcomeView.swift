import SwiftUI

struct ClaimOutcomeView: View {
    @State private var viewModel: ClaimOutcomeViewModel

    init(api: APIClient, claimId: String) {
        _viewModel = State(initialValue: ClaimOutcomeViewModel(api: api, claimId: claimId))
    }

    var body: some View {
        Group {
            switch viewModel.loadState {
            case .idle, .loading:
                VStack {
                    Spacer()
                    ProgressView()
                    Spacer()
                }

            case let .failed(message):
                VStack(spacing: 12) {
                    Spacer()
                    PFTypography.section("Couldn’t load claim status")
                    PFTypography.caption(message)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 24)
                    Button("Retry") {
                        Task { await viewModel.load() }
                    }
                    .buttonStyle(PFPrimaryButtonStyle())
                    .padding(.horizontal, 24)
                    Spacer()
                }

            case .loaded:
                if let data = viewModel.data {
                    ScrollView {
                        VStack(alignment: .leading, spacing: 16) {
                            if data.outcome.state == "confirmed" {
                                BookingConfirmedCard(claim: data.claim, outcome: data.outcome)
                            } else {
                                ClaimOutcomeHeroCard(outcome: data.outcome)
                                ClaimOutcomeBookingCard(claim: data.claim)
                            }

                            ClaimOutcomeNextStepsCard(steps: data.nextSteps)

                            Text(helperCopy(for: data.outcome.state))
                                .font(.system(size: 13))
                                .foregroundStyle(PFColor.textSecondary)
                        }
                        .padding(20)
                        .padding(.bottom, 28)
                    }
                }
            }
        }
        .background(PFColor.background.ignoresSafeArea())
        .navigationTitle("Claim status")
        .navigationBarTitleDisplayMode(.inline)
        .task {
            await viewModel.load()
        }
        .refreshable {
            await viewModel.refresh()
        }
    }

    private func helperCopy(for state: String) -> String {
        switch state {
        case "confirmed":
            "You can come back here anytime to review this confirmed opening."
        case "pending_confirmation":
            "You can check back here anytime for the latest update."
        case "lost", "unavailable", "expired":
            "Keep standby on so you can catch the next good opening."
        default:
            "You can check back here anytime for the latest update."
        }
    }
}
