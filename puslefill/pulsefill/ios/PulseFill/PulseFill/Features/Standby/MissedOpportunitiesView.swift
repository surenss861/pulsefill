import SwiftUI

struct MissedOpportunitiesView: View {
    @State private var viewModel: MissedOpportunitiesViewModel

    init(api: APIClient) {
        _viewModel = State(initialValue: MissedOpportunitiesViewModel(api: api))
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
                    PFTypography.section("Couldn’t load recent opportunities")
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
                            MissedOpportunitiesSummaryCard(summary: data.summary)
                                .padding(.horizontal, 20)

                            Text(
                                "A few openings may pass by for normal reasons. This helps you see what happened and improve your chances next time."
                            )
                            .font(.system(size: 13))
                            .foregroundStyle(PFColor.textSecondary)
                            .padding(.horizontal, 20)

                            if data.items.isEmpty {
                                Text("No missed opportunities recently.")
                                    .font(.system(size: 13))
                                    .foregroundStyle(PFColor.textSecondary)
                                    .padding(.horizontal, 20)
                                    .padding(.top, 8)
                            } else {
                                LazyVStack(spacing: 12) {
                                    ForEach(data.items) { item in
                                        MissedOpportunityCard(item: item)
                                    }
                                }
                                .padding(.horizontal, 20)
                                .padding(.bottom, 24)
                            }
                        }
                        .padding(.top, 16)
                    }
                    .refreshable { await viewModel.refresh() }
                }
            }
        }
        .background(PFColor.background.ignoresSafeArea())
        .navigationTitle("Recent opportunities")
        .navigationBarTitleDisplayMode(.inline)
        .task {
            await viewModel.load()
        }
    }
}
