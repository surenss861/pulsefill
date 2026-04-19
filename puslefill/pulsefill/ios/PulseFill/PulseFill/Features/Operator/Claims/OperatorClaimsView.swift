import SwiftUI

struct OperatorClaimsView: View {
    @EnvironmentObject private var env: AppEnvironment
    @StateObject private var viewModel: OperatorClaimsViewModel
    @State private var path = NavigationPath()
    @State private var showFlash = false

    init(api: APIClient) {
        _viewModel = StateObject(wrappedValue: OperatorClaimsViewModel(api: api))
    }

    var body: some View {
        NavigationStack(path: $path) {
            Group {
                if case let .failed(msg) = viewModel.loadState, viewModel.claims.isEmpty {
                    errorView(msg)
                } else if !viewModel.didLoadOnce {
                    loadingView
                } else {
                    contentView
                }
            }
            .background(PFColor.background.ignoresSafeArea())
            .navigationTitle("Claims")
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
            .onChange(of: viewModel.flashMessage) { _, new in
                showFlash = new != nil
            }
            .alert("Update", isPresented: $showFlash) {
                Button("OK", role: .cancel) {
                    viewModel.flashMessage = nil
                }
            } message: {
                Text(viewModel.flashMessage ?? "")
            }
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
        VStack(spacing: 12) {
            Spacer()
            Text("Couldn’t load claims")
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
                OperatorClaimsSummaryBar(
                    awaitingCount: viewModel.awaitingCount,
                    confirmedCount: viewModel.confirmedCount,
                    totalCount: viewModel.claims.count
                )
                .padding(.horizontal, 4)

                Picker("Filter", selection: $viewModel.selectedFilter) {
                    ForEach(OperatorClaimsFilter.allCases) { filter in
                        Text(filter.rawValue).tag(filter)
                    }
                }
                .pickerStyle(.segmented)
                .padding(.horizontal, 4)

                if viewModel.filteredClaims.isEmpty {
                    Text(emptyCopy)
                        .font(.system(size: 13))
                        .foregroundStyle(PFColor.textSecondary)
                        .padding(.top, 4)
                } else {
                    VStack(spacing: 12) {
                        ForEach(viewModel.filteredClaims) { claim in
                            OperatorClaimCard(
                                claim: claim,
                                isConfirming: viewModel.confirmingClaimId == claim.claimId,
                                onConfirm: {
                                    Task { await viewModel.confirm(claim) }
                                },
                                onOpen: {
                                    path.append(claim.openSlotId)
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
        case .all: "No claims with a winning customer yet."
        case .awaiting: "Nothing needs confirmation right now."
        case .confirmed: "No confirmed bookings yet."
        }
    }
}
