import SwiftUI

struct OperatorOverviewView: View {
    @StateObject private var viewModel: OperatorOverviewViewModel

    init(api: APIClient) {
        _viewModel = StateObject(wrappedValue: OperatorOverviewViewModel(api: api))
    }

    var body: some View {
        NavigationStack {
            Group {
                if case let .failed(message) = viewModel.loadState,
                   viewModel.dailySummary == nil,
                   viewModel.queueSummary == nil {
                    errorView(message)
                } else if viewModel.dailySummary == nil && viewModel.queueSummary == nil {
                    loadingView
                } else {
                    contentView
                }
            }
            .background(PFColor.background.ignoresSafeArea())
            .navigationTitle("Overview")
            .navigationBarTitleDisplayMode(.large)
            .toolbarBackground(PFColor.surface1, for: .navigationBar)
            .toolbarColorScheme(.dark, for: .navigationBar)
            .task { await viewModel.load() }
            .refreshable { await viewModel.refresh() }
        }
    }

    private var loadingView: some View {
        VStack {
            Spacer()
            ProgressView().tint(PFColor.primary)
            Spacer()
        }
    }

    private func errorView(_ message: String) -> some View {
        EmptyStateView(
            title: "Couldn’t load overview",
            message: message,
            actionTitle: "Retry",
            action: { Task { await viewModel.load() } }
        )
    }

    private var contentView: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                PFPageHeader(
                    overline: "Overview",
                    title: "Today at a glance",
                    subtitle: "What needs attention now across queue pressure and recovery throughput."
                )

                if let daily = viewModel.dailySummary {
                    OperatorDailyOpsSummaryBar(summary: daily)
                }

                if let summary = viewModel.queueSummary {
                    PFSectionCard(
                        eyebrow: "Queue",
                        title: "Current recovery workload",
                        description: "Live counts grouped by urgency."
                    ) {
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 10) {
                                PFMetricCard(value: "\(summary.needsActionCount)", label: "Needs action", tone: PFColor.warning)
                                PFMetricCard(value: "\(summary.reviewCount)", label: "Review", tone: PFColor.primary)
                                PFMetricCard(value: "\(summary.resolvedCount)", label: "Resolved", tone: PFColor.success)
                                PFMetricCard(value: "\(summary.awaitingConfirmationCount)", label: "Awaiting", tone: PFColor.warning)
                                PFMetricCard(value: "\(summary.deliveryFailedCount)", label: "Failures", tone: PFColor.error)
                            }
                        }
                    }
                }

                if let digest = viewModel.morningDigest {
                    PFSectionCard(
                        eyebrow: "Digest",
                        title: "Morning recovery focus",
                        description: "Top sections to work first before opening queue and slots."
                    ) {
                        VStack(alignment: .leading, spacing: 8) {
                            ForEach(digest.sections.prefix(3), id: \.kind) { section in
                                HStack(alignment: .firstTextBaseline, spacing: 10) {
                                    PFStatusPill(text: section.title, variant: .primary)
                                    Text("\(section.slotIds.count) slots")
                                        .font(.system(size: 13))
                                        .foregroundStyle(PFColor.textSecondary)
                                }
                            }
                        }
                    }
                }
            }
            .padding(.top, 16)
            .padding(.horizontal, 20)
            .padding(.bottom, 24)
        }
    }
}
