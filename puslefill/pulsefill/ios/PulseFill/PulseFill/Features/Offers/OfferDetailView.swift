import SwiftUI

/// Canonical offer surface: loads `GET /v1/customers/me/offers/:id` for rich context + claim CTA.
struct OfferDetailView: View {
    @EnvironmentObject private var env: AppEnvironment
    @State private var viewModel: OfferDetailViewModel

    init(api: APIClient, offerId: String) {
        _viewModel = State(initialValue: OfferDetailViewModel(api: api, offerId: offerId))
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
                    PFTypography.section("Couldn’t load this offer")
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
                if let offer = viewModel.offer {
                    offerContent(offer)
                }
            }
        }
        .background(PFColor.background.ignoresSafeArea())
        .navigationTitle("Offer")
        .navigationBarTitleDisplayMode(.inline)
        .task {
            await viewModel.load()
        }
        .refreshable {
            await viewModel.refresh()
        }
    }

    @ViewBuilder
    private func offerContent(_ offer: CustomerOfferDetail) -> some View {
        VStack(spacing: 0) {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    OfferHeroCard(offer: offer)
                    OfferExpiryCard(expiresAtIso: offer.expiresAt)
                    OfferMatchReasonCard(offer: offer)
                    OfferClaimConfidenceCard(guidance: offer.claimGuidance)

                    Text("You’ll see what happens next right after you claim.")
                        .font(.system(size: 13))
                        .foregroundStyle(PFColor.textSecondary)
                }
                .padding(20)
                .padding(.bottom, 16)
            }

            if let slotId = offer.openSlotId, !slotId.isEmpty {
                VStack(spacing: 10) {
                    NavigationLink {
                        ClaimSlotView(openSlotId: slotId)
                    } label: {
                        Text(viewModel.isExpired ? "Offer expired" : "Claim opening")
                            .font(.system(size: 18, weight: .heavy, design: .rounded))
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(PFPrimaryButtonStyle())
                    .disabled(!viewModel.canClaim)

                    Text(viewModel.isExpired ? "This offer can no longer be claimed." : "Primary action for this offer")
                        .font(.system(size: 11, weight: .semibold))
                        .foregroundStyle(PFColor.textSecondary)
                }
                .padding(.horizontal, 20)
                .padding(.top, 12)
                .padding(.bottom, 18)
                .background(PFColor.surface1.opacity(0.96))
                .overlay(alignment: .top) {
                    Rectangle()
                        .fill(PFColor.divider)
                        .frame(height: 1)
                }
            }
        }
    }
}
