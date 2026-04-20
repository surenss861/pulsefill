import SwiftUI

struct OperatorSlotsListView: View {
    @EnvironmentObject private var env: AppEnvironment
    @StateObject private var viewModel: OperatorSlotsListViewModel
    @State private var path = NavigationPath()

    init(api: APIClient) {
        _viewModel = StateObject(wrappedValue: OperatorSlotsListViewModel(api: api))
    }

    var body: some View {
        NavigationStack(path: $path) {
            Group {
                switch viewModel.loadState {
                case .idle, .loading:
                    loadingView
                case let .failed(message):
                    errorView(message)
                case .loaded:
                    contentView
                }
            }
            .background(PFColor.background.ignoresSafeArea())
            .navigationTitle("Slots")
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
            Text("Couldn’t load slots")
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
            .padding(.horizontal, 24)
            Spacer()
        }
    }

    private var contentView: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                OperatorSlotsSummaryBar(counts: viewModel.counts)

                Picker("Filter", selection: $viewModel.selectedFilter) {
                    ForEach(OperatorSlotsFilter.allCases) { filter in
                        Text(filter.rawValue).tag(filter)
                    }
                }
                .pickerStyle(.segmented)
                .padding(.horizontal, 4)

                if viewModel.filterOptionsLoading {
                    Text("Loading filters…")
                        .font(.system(size: 13))
                        .foregroundStyle(PFColor.textSecondary)
                } else {
                    VStack(alignment: .leading, spacing: 10) {
                        entityPicker(
                            "Provider",
                            viewModel.providerOptions,
                            selection: Binding(
                                get: { viewModel.filterProviderId },
                                set: { viewModel.setFilterProviderId($0) }
                            )
                        )
                        entityPicker(
                            "Location",
                            viewModel.locationOptions,
                            selection: Binding(
                                get: { viewModel.filterLocationId },
                                set: { viewModel.setFilterLocationId($0) }
                            )
                        )
                        entityPicker(
                            "Service",
                            viewModel.serviceOptions,
                            selection: Binding(
                                get: { viewModel.filterServiceId },
                                set: { viewModel.setFilterServiceId($0) }
                            )
                        )
                    }
                }

                if viewModel.filteredSlots.isEmpty {
                    Text(emptyCopy)
                        .font(.system(size: 13))
                        .foregroundStyle(PFColor.textSecondary)
                        .padding(.top, 4)
                } else {
                    VStack(spacing: 12) {
                        ForEach(viewModel.filteredSlots) { slot in
                            OperatorSlotListRow(
                                slot: slot,
                                primaryAction: viewModel.primaryAction(for: slot),
                                isPerforming: viewModel.performingSlotId == slot.id,
                                onPrimaryAction: {
                                    Task { await viewModel.performPrimaryAction(for: slot) }
                                },
                                onOpen: {
                                    path.append(slot.id)
                                }
                            )
                        }
                    }
                    .padding(.bottom, 24)
                }
            }
            .padding(.top, 16)
            .padding(.horizontal, 20)
        }
    }

    private var emptyCopy: String {
        switch viewModel.selectedFilter {
        case .all: "No slots yet."
        case .open: "No open slots right now."
        case .offered: "No offered slots right now."
        case .claimed: "No claimed slots awaiting confirmation."
        case .booked: "No booked slots yet."
        case .expired: "No expired slots yet."
        case .cancelled: "No cancelled slots."
        }
    }

    private func entityPicker(
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

