import SwiftUI

struct StandbyStatusView: View {
    @StateObject private var viewModel: StandbyStatusViewModel
    private let onGoToProfileTab: (() -> Void)?

    init(api: APIClient, onGoToProfileTab: (() -> Void)? = nil) {
        self.onGoToProfileTab = onGoToProfileTab
        _viewModel = StateObject(wrappedValue: StandbyStatusViewModel(api: api))
    }

    var body: some View {
        Group {
            switch viewModel.loadState {
            case .idle, .loading:
                ZStack {
                    PFScreenBackground()
                    PFCustomerLoadingState(
                        title: "Loading standby status…",
                        message: "Checking your preferences and how we can reach you.",
                        compact: false
                    )
                }

            case let .failed(message):
                ScrollView {
                    VStack(alignment: .leading, spacing: 16) {
                        PFCustomerErrorState(
                            title: "We couldn’t load standby status",
                            message: PFCustomerFacingErrorCopy.sanitizeCustomerMessage(message),
                            primaryTitle: "Try again",
                            primaryAction: { Task { await viewModel.load() } },
                            secondaryTitle: nil,
                            secondaryAction: nil
                        )
                    }
                    .padding(.horizontal, 20)
                    .padding(.top, 24)
                }
                .background(PFScreenBackground())

            case .loaded:
                content
            }
        }
        .background(PFScreenBackground())
        .navigationTitle("Standby status")
        .navigationBarTitleDisplayMode(.inline)
        .task {
            await viewModel.load()
        }
        .refreshable {
            await viewModel.refresh()
        }
    }

    @ViewBuilder
    private var content: some View {
        if let data = viewModel.data {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    PFCustomerInfoCallout(
                        title: "What this screen shows",
                        message:
                            "A quick read on standby coverage, how PulseFill can notify you about openings, and your saved preferences — in plain language.",
                        variant: .neutral
                    )

                    StandbyStatusSummaryCard(summary: data.summary)

                    StandbyNotificationReadinessCard(readiness: data.notificationReadiness)

                    if !data.guidance.isEmpty {
                        VStack(alignment: .leading, spacing: 10) {
                            PFTypography.Customer.label("Suggested next steps")
                            ForEach(data.guidance) { item in
                                StandbyGuidanceCard(item: item)
                            }
                        }
                    }

                    StandbyRecentActivityCard(activity: data.recentActivity)

                    if !data.preferences.isEmpty {
                        VStack(alignment: .leading, spacing: 10) {
                            PFTypography.Customer.label("Your standby preferences")
                            ForEach(data.preferences) { pref in
                                StandbyStatusPreferenceCard(row: pref)
                            }
                        }
                    } else {
                        PFCustomerSectionCard(variant: .quiet, padding: 18) {
                            VStack(alignment: .leading, spacing: 12) {
                                Text("No standby preferences yet")
                                    .font(.system(size: 17, weight: .semibold))
                                    .foregroundStyle(PFColor.textPrimary)

                                Text(
                                    "When you’re connected to a business, add standby preferences from Profile so we know which openings to send."
                                )
                                .font(.system(size: 14, weight: .medium))
                                .foregroundStyle(PFColor.textSecondary)
                                .lineSpacing(3)

                                if let onGoToProfileTab {
                                    PFCustomerSecondaryButton(title: "Go to Profile") {
                                        PFHaptics.lightImpact()
                                        onGoToProfileTab()
                                    }
                                }
                            }
                        }
                    }
                }
                .padding(.horizontal, 20)
                .padding(.vertical, 20)
                .padding(.bottom, 24)
            }
        }
    }
}
