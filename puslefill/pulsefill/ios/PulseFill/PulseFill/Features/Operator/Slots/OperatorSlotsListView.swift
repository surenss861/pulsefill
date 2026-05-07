import SwiftUI

struct OperatorSlotsListView: View {
    @EnvironmentObject private var env: AppEnvironment
    @Environment(\.dismiss) private var dismiss
    @StateObject private var viewModel: OperatorSlotsListViewModel
    @State private var path = NavigationPath()
    private let digestContext: OperatorSlotsDigestContext?
    /// When set (Business shell only), toolbar can jump to the Create tab.
    private let businessShellSelectedTab: Binding<BusinessShellTab>?

    init(
        businessAPI: BusinessOperatorAPIClient,
        digestContext: OperatorSlotsDigestContext? = nil,
        businessShellSelectedTab: Binding<BusinessShellTab>? = nil
    ) {
        self.digestContext = digestContext
        self.businessShellSelectedTab = businessShellSelectedTab
        _viewModel = StateObject(wrappedValue: OperatorSlotsListViewModel(businessAPI: businessAPI, digestContext: digestContext))
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
            .navigationTitle("Open Slots")
            .navigationBarTitleDisplayMode(.large)
            .toolbarBackground(PFColor.surface1, for: .navigationBar)
            .toolbarColorScheme(.dark, for: .navigationBar)
            .toolbar {
                if let tabBinding = businessShellSelectedTab {
                    ToolbarItem(placement: .topBarTrailing) {
                        Button {
                            tabBinding.wrappedValue = .create
                        } label: {
                            Image(systemName: "plus.circle.fill")
                        }
                        .accessibilityLabel("Create opening")
                    }
                }
            }
            .navigationDestination(for: String.self) { slotId in
                OperatorSlotDetailView(businessAPI: env.businessOperatorAPI, slotId: slotId)
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
        ScrollView {
            VStack(alignment: .leading, spacing: 14) {
                PFPageHeader(
                    overline: "Slots",
                    title: "Open Slots",
                    subtitle: "Inventory view across all openings and their recovery state."
                )
                OperatorListLoadingPlaceholder(
                    title: "Loading openings…",
                    subtitle: "Fetching slots and filter options.",
                    skeletonCount: 4
                )
            }
            .padding(.top, 16)
            .padding(.horizontal, 20)
        }
    }

    private func errorView(_ message: String) -> some View {
        VStack(spacing: 12) {
            Spacer()
            OperatorErrorStateCard(
                title: "Couldn’t load openings",
                message: "Refresh and try again.",
                technicalMessage: message,
                onRetry: { await viewModel.load() }
            )
            .padding(.horizontal, 20)
            Spacer()
        }
    }

    private var contentView: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                if businessShellSelectedTab != nil {
                    BusinessWorkspaceStrip()
                        .environmentObject(env)
                }

                PFPageHeader(
                    overline: "Slots",
                    title: "Open Slots",
                    subtitle: "Inventory view across all openings and their recovery state."
                )

                if let digest = digestContext {
                    digestBanner(digest)
                }

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
                    if viewModel.slots.isEmpty {
                        OperatorEmptyStateCard(
                            systemImage: "calendar.badge.plus",
                            title: "No openings posted",
                            message: "Create an opening so standby customers can receive offers when you cancel or free a slot.",
                            primaryButtonTitle: businessShellSelectedTab != nil ? "Create opening" : nil,
                            primaryAction: businessShellSelectedTab != nil
                                ? { businessShellSelectedTab?.wrappedValue = .create }
                                : nil
                        )
                        .padding(.top, 8)
                    } else {
                        OperatorEmptyStateCard(
                            systemImage: "line.3.horizontal.decrease.circle",
                            title: "Nothing matches this view",
                            message: emptyCopy,
                            primaryButtonTitle: nil,
                            primaryAction: nil
                        )
                        .padding(.top, 8)
                    }
                } else {
                    VStack(spacing: 12) {
                        ForEach(viewModel.filteredSlots) { slot in
                            OperatorSlotListRow(
                                slot: slot,
                                primaryAction: viewModel.primaryAction(for: slot),
                                isPerforming: viewModel.performingSlotId == slot.id,
                                successPulseTrigger: (viewModel.successPulseItemId == slot.id) ? "\(slot.id)-\(viewModel.successPulseTick)" : slot.id,
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

    private func digestBanner(_ digest: OperatorSlotsDigestContext) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 4) {
                    Text(digest.title)
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundStyle(PFColor.textPrimary)
                    if let sub = digest.subtitle, !sub.isEmpty {
                        Text(sub)
                            .font(.system(size: 12))
                            .foregroundStyle(PFColor.textSecondary)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                }
                Spacer()
                Button("Done") {
                    dismiss()
                }
                .font(.system(size: 13, weight: .semibold))
                .foregroundStyle(PFColor.primary)
            }
        }
        .padding(12)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(PFSurface.card)
        .overlay(
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .stroke(PFColor.textSecondary.opacity(0.15), lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
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

