import SwiftUI

struct StandbyStatusView: View {
    @StateObject private var viewModel: StandbyStatusViewModel

    init(api: APIClient) {
        _viewModel = StateObject(wrappedValue: StandbyStatusViewModel(api: api))
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
                    Text("Couldn’t load standby status")
                        .font(.system(size: 17, weight: .semibold))
                        .foregroundStyle(PFColor.textPrimary)

                    Text(message)
                        .font(.system(size: 13, weight: .regular))
                        .foregroundStyle(PFColor.textSecondary)
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
                content
            }
        }
        .background(PFColor.background.ignoresSafeArea())
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
                VStack(alignment: .leading, spacing: PFSpacing.md) {
                    StandbyStatusSummaryCard(summary: data.summary)

                    StandbyNotificationReadinessCard(readiness: data.notificationReadiness)

                    if !data.guidance.isEmpty {
                        VStack(alignment: .leading, spacing: 10) {
                            Text("NEXT STEPS")
                                .font(.system(size: 11, weight: .semibold))
                                .foregroundStyle(PFColor.textSecondary)
                            ForEach(data.guidance) { item in
                                StandbyGuidanceCard(item: item)
                            }
                        }
                    }

                    StandbyRecentActivityCard(activity: data.recentActivity)

                    if !data.preferences.isEmpty {
                        VStack(alignment: .leading, spacing: 10) {
                            Text("YOUR PREFERENCES")
                                .font(.system(size: 11, weight: .semibold))
                                .foregroundStyle(PFColor.textSecondary)
                            ForEach(data.preferences) { pref in
                                StandbyStatusPreferenceCard(row: pref)
                            }
                        }
                    } else {
                        Text("No standby preferences yet — add one from Preferences.")
                            .font(.system(size: 13, weight: .regular))
                            .foregroundStyle(PFColor.textSecondary)
                    }
                }
                .padding(.horizontal, 20)
                .padding(.vertical, 20)
                .padding(.bottom, 24)
            }
        }
    }
}
