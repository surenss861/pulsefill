import SwiftUI

struct OperatorActionQueueView: View {
    @EnvironmentObject private var env: AppEnvironment
    @StateObject private var viewModel: OperatorActionQueueViewModel
    @State private var path = NavigationPath()

    init(api: APIClient) {
        _viewModel = StateObject(wrappedValue: OperatorActionQueueViewModel(api: api))
    }

    var body: some View {
        NavigationStack(path: $path) {
            Group {
                if case let .failed(message) = viewModel.loadState, viewModel.response == nil {
                    errorView(message)
                } else if !viewModel.didLoadOnce {
                    loadingView
                } else {
                    contentView
                }
            }
            .background(PFColor.background.ignoresSafeArea())
            .navigationTitle("Action queue")
            .navigationBarTitleDisplayMode(.large)
            .toolbarBackground(PFColor.surface1, for: .navigationBar)
            .toolbarColorScheme(.dark, for: .navigationBar)
            .navigationDestination(for: String.self) { slotId in
                OperatorSlotDetailView(api: env.apiClient, slotId: slotId)
            }
            .task {
                await viewModel.load()
            }
            .refreshable {
                await viewModel.refresh()
            }
        }
    }

    private var loadingView: some View {
        VStack {
            Spacer()
            ProgressView()
                .tint(PFColor.primary)
            Spacer()
        }
    }

    private func errorView(_ message: String) -> some View {
        VStack(spacing: 12) {
            Spacer()
            Text("Couldn’t load action queue")
                .font(.system(size: 17, weight: .semibold))
                .foregroundStyle(PFColor.textPrimary)
            Text(message)
                .font(.system(size: 13))
                .foregroundStyle(PFColor.textSecondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 24)
            Button("Retry") {
                Task { await viewModel.load() }
            }
            .buttonStyle(PFPrimaryButtonStyle())
            Spacer()
        }
    }

    private var contentView: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                if let summary = viewModel.summary {
                    OperatorActionQueueSummaryBar(summary: summary)
                }

                Picker("Filter", selection: $viewModel.selectedFilter) {
                    ForEach(OperatorQueueFilter.allCases) { filter in
                        Text(filter.rawValue).tag(filter)
                    }
                }
                .pickerStyle(.segmented)
                .padding(.horizontal, 4)

                VStack(spacing: 20) {
                    OperatorActionQueueSectionView(
                        title: "Needs action now",
                        items: viewModel.filteredNeedsAction,
                        onPrimaryAction: handlePrimary,
                        onOpen: openSlot
                    )

                    OperatorActionQueueSectionView(
                        title: "Watch / review",
                        items: viewModel.filteredReview,
                        onPrimaryAction: handlePrimary,
                        onOpen: openSlot
                    )

                    OperatorActionQueueSectionView(
                        title: "Recently resolved",
                        items: viewModel.filteredResolved,
                        onPrimaryAction: handlePrimary,
                        onOpen: openSlot
                    )
                }
                .padding(.bottom, 24)
            }
            .padding(.top, 16)
            .padding(.horizontal, 20)
        }
    }

    private func handlePrimary(_ item: OperatorActionQueueItem) {
        guard let first = item.actions.first else {
            openSlot(item)
            return
        }
        switch first {
        case .openSlot, .viewSlot, .confirmBooking, .inspectLogs, .retryOffers:
            path.append(item.openSlotId)
        }
    }

    private func openSlot(_ item: OperatorActionQueueItem) {
        path.append(item.openSlotId)
    }
}
