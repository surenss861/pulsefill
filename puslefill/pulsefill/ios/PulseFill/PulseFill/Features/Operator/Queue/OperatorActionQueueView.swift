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
            .alert(
                "Update",
                isPresented: Binding(
                    get: { viewModel.flashMessage != nil },
                    set: { if !$0 { viewModel.flashMessage = nil } }
                ),
                actions: {
                    Button("OK", role: .cancel) {}
                },
                message: {
                    Text(viewModel.flashMessage ?? "")
                }
            )
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
                if let daily = viewModel.dailySummary {
                    OperatorDailyOpsSummaryBar(summary: daily)
                }

                if let breakdown = viewModel.opsBreakdown {
                    OperatorInsightsPreviewCard(breakdown: breakdown)
                }

                if let delivery = viewModel.deliveryReliability {
                    OperatorDeliveryReliabilityCard(data: delivery)
                }

                if let summary = viewModel.summary {
                    OperatorActionQueueSummaryBar(summary: summary)
                }

                if viewModel.filterOptionsLoading {
                    Text("Loading filters…")
                        .font(.system(size: 13))
                        .foregroundStyle(PFColor.textSecondary)
                } else {
                    VStack(alignment: .leading, spacing: 10) {
                        queueEntityPicker(
                            "Provider",
                            viewModel.providerOptions,
                            selection: Binding(
                                get: { viewModel.filterProviderId },
                                set: { viewModel.setFilterProviderId($0) }
                            )
                        )
                        queueEntityPicker(
                            "Location",
                            viewModel.locationOptions,
                            selection: Binding(
                                get: { viewModel.filterLocationId },
                                set: { viewModel.setFilterLocationId($0) }
                            )
                        )
                        queueEntityPicker(
                            "Service",
                            viewModel.serviceOptions,
                            selection: Binding(
                                get: { viewModel.filterServiceId },
                                set: { viewModel.setFilterServiceId($0) }
                            )
                        )
                    }
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
                        performingItemId: viewModel.performingItemId,
                        onPrimaryAction: handlePrimary,
                        onOpen: openSlot
                    )

                    OperatorActionQueueSectionView(
                        title: "Watch / review",
                        items: viewModel.filteredReview,
                        performingItemId: viewModel.performingItemId,
                        onPrimaryAction: handlePrimary,
                        onOpen: openSlot
                    )

                    OperatorActionQueueSectionView(
                        title: "Recently resolved",
                        items: viewModel.filteredResolved,
                        performingItemId: viewModel.performingItemId,
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
        if OperatorPrimaryActionDeriver.queueInline(from: item) != nil {
            Task {
                await viewModel.performPrimaryAction(for: item)
            }
            return
        }

        guard item.actions.first != nil else {
            openSlot(item)
            return
        }
        path.append(item.openSlotId)
    }

    private func openSlot(_ item: OperatorActionQueueItem) {
        path.append(item.openSlotId)
    }

    private func queueEntityPicker(
        _ title: String,
        _ options: [BusinessNamedRow],
        selection: Binding<String?>
    ) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(title)
                .font(.system(size: 12))
                .foregroundStyle(PFColor.textSecondary)

            Picker(title, selection: selection) {
                Text("All").tag(String?.none)
                ForEach(options, id: \.id) { row in
                    Text(row.name).tag(Optional(row.id))
                }
            }
            .pickerStyle(.menu)
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(12)
            .background(PFSurface.card)
            .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
        }
    }
}
