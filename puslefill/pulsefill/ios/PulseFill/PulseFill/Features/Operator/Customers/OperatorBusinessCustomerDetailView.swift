import Combine
import SwiftUI

@MainActor
final class OperatorBusinessCustomerDetailViewModel: ObservableObject {
    enum LoadState: Equatable {
        case idle
        case loading
        case loaded
        case failed(String)
    }

    @Published private(set) var loadState: LoadState = .idle
    @Published private(set) var context: OperatorCustomerContextResponse?

    private let businessAPI: BusinessOperatorAPIClient
    private let customerId: String

    init(businessAPI: BusinessOperatorAPIClient, customerId: String) {
        self.businessAPI = businessAPI
        self.customerId = customerId
    }

    func load() async {
        loadState = .loading
        do {
            context = try await businessAPI.operatorCustomerContext(customerId: customerId)
            loadState = .loaded
        } catch {
            loadState = .failed(APIErrorCopy.message(for: error))
        }
    }
}

/// Full-screen customer context loaded from `/v1/businesses/mine/customers/:customerId/context`.
struct OperatorBusinessCustomerDetailView: View {
    @StateObject private var viewModel: OperatorBusinessCustomerDetailViewModel

    init(businessAPI: BusinessOperatorAPIClient, customerId: String) {
        _viewModel = StateObject(
            wrappedValue: OperatorBusinessCustomerDetailViewModel(businessAPI: businessAPI, customerId: customerId)
        )
    }

    var body: some View {
        Group {
            switch viewModel.loadState {
            case .idle, .loading:
                ProgressView().tint(PFColor.primary)
            case let .failed(msg):
                loadFailed(msg)
            case .loaded:
                if let ctx = viewModel.context {
                    loadedScroll(ctx)
                } else {
                    loadFailed("No customer context returned.")
                }
            }
        }
        .background(PFColor.background.ignoresSafeArea())
        .navigationTitle("Customer")
        .navigationBarTitleDisplayMode(.inline)
        .toolbarBackground(PFColor.surface1, for: .navigationBar)
        .toolbarColorScheme(.dark, for: .navigationBar)
        .task {
            await viewModel.load()
        }
        .refreshable {
            await viewModel.load()
        }
    }

    private func loadFailed(_ message: String) -> some View {
        VStack(spacing: 14) {
            Text("Couldn’t load customer")
                .font(.system(size: 17, weight: .semibold))
                .foregroundStyle(PFColor.textPrimary)
            Text("Other business actions still work — pull to refresh or try again in a moment.")
                .font(.system(size: 13, weight: .medium))
                .foregroundStyle(PFColor.textSecondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 20)
            Text(message)
                .font(.system(size: 14))
                .foregroundStyle(PFColor.textSecondary.opacity(0.9))
                .multilineTextAlignment(.center)
                .padding(.horizontal, 24)
            Button("Retry") {
                Task { await viewModel.load() }
            }
            .buttonStyle(PFPrimaryButtonStyle())
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    private func loadedScroll(_ ctx: OperatorCustomerContextResponse) -> some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                PFPageHeader(
                    overline: "Customer context",
                    title: ctx.customer.displayName?.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty == false
                        ? (ctx.customer.displayName ?? "Customer")
                        : "Customer",
                    subtitle: "Pilot-safe summary: how this person can be reached and what standby they’ve set."
                )

                OperatorCustomerSummaryCard(customer: ctx.customer, delivery: ctx.deliveryContext)
                OperatorStandbyPreferencesSection(preferences: ctx.standbyPreferences)
            }
            .padding(20)
            .padding(.bottom, 28)
        }
    }
}
