import SwiftUI

/// Customer-facing opening detail: patient-safe copy, clear status, inline claim.
struct OfferDetailView: View {
    @EnvironmentObject private var env: AppEnvironment
    @State private var viewModel: OfferDetailViewModel
    @State private var previousDetailStatus: CustomerOfferDisplayStatus?
    @State private var statusPulseTick = 0

    init(api: APIClient, offerId: String) {
        _viewModel = State(initialValue: OfferDetailViewModel(api: api, offerId: offerId))
    }

    var body: some View {
        Group {
            switch viewModel.loadState {
            case .idle, .loading:
                ZStack {
                    PFScreenBackground()
                    PFCustomerLoadingState(
                        title: "Loading opening…",
                        message: "Getting the latest details.",
                        compact: false,
                    )
                }

            case let .failed(message):
                ScrollView {
                    VStack(alignment: .leading, spacing: 16) {
                        PFCustomerErrorState(
                            title: "Opening unavailable",
                            message: PFCustomerFacingErrorCopy.sanitizeCustomerMessage(message),
                            primaryTitle: "Try again",
                            primaryAction: { Task { await viewModel.load() } },
                            secondaryTitle: nil,
                            secondaryAction: nil,
                        )
                    }
                    .padding(.horizontal, 20)
                    .padding(.top, 24)
                }
                .background(PFScreenBackground())

            case .loaded:
                if let offer = viewModel.offer {
                    loadedBody(offer)
                } else {
                    PFScreenBackground()
                }
            }
        }
        .navigationTitle("Opening")
        .navigationBarTitleDisplayMode(.inline)
        .toolbarBackground(PFColor.customerTabBar, for: .navigationBar)
        .toolbarColorScheme(.dark, for: .navigationBar)
        .tint(PFColor.ember)
        .task {
            await viewModel.load()
        }
        .refreshable {
            await viewModel.refresh()
        }
        .onChange(of: viewModel.displayStatus) { _, new in
            if let prev = previousDetailStatus, prev != new {
                statusPulseTick += 1
            }
            previousDetailStatus = new
        }
    }

    @ViewBuilder
    private func loadedBody(_ offer: CustomerOfferDetail) -> some View {
        let ui = viewModel.detailUIState
        let pillStatus = customerOfferDisplayStatus(forDetail: offer)

        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                offerDetailStatusBanner(uiState: ui)
                    .customerAppearAnimation(staggerIndex: 0)

                if let msg = viewModel.successBanner, !msg.isEmpty {
                    Text(msg)
                        .font(.system(size: 14, weight: .medium))
                        .foregroundStyle(PFColor.success)
                        .padding(.horizontal, 4)
                }
                if let err = viewModel.errorBanner, !err.isEmpty {
                    Text(err)
                        .font(.system(size: 14, weight: .medium))
                        .foregroundStyle(PFColor.error)
                        .padding(.horizontal, 4)
                }

                offerBusinessServiceCard(offer: offer, pillStatus: pillStatus)
                    .customerAppearAnimation(staggerIndex: 1)

                VStack(alignment: .leading, spacing: 12) {
                    offerTimeLocationCard(offer: offer)
                    if let exp = offer.expiresAt?.trimmingCharacters(in: .whitespacesAndNewlines), !exp.isEmpty {
                        OfferExpiryCard(expiresAtIso: exp)
                    }
                }
                .customerAppearAnimation(staggerIndex: 2)

                offerWhyReceivedCard(uiState: ui, offer: offer)
                    .customerAppearAnimation(staggerIndex: 3)

                offerNextStepCard(uiState: ui, offer: offer)
                    .customerAppearAnimation(staggerIndex: 4)

                if let claimId = viewModel.lastClaimId, ui == .waitingForConfirmation {
                    NavigationLink {
                        ClaimOutcomeView(api: env.apiClient, claimId: claimId)
                    } label: {
                        Text("View claim status")
                            .font(.system(size: 16, weight: .semibold))
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 12)
                    }
                    .buttonStyle(.bordered)
                    .tint(PFColor.ember)
                    .customerAppearAnimation(staggerIndex: 5)
                }
            }
            .padding(.horizontal, 20)
            .padding(.top, 20)
            .padding(.bottom, 120)
        }
        .background(PFScreenBackground())
        .safeAreaInset(edge: .bottom, spacing: 0) {
            if let slotId = offer.openSlotId, !slotId.isEmpty, ui.showsClaimButton || viewModel.isClaiming {
                CustomerStickyActionBar {
                    PFCustomerPrimaryButton(
                        title: viewModel.primaryActionTitle,
                        isEnabled: viewModel.canClaim,
                        isLoading: viewModel.isClaiming,
                        onDisabledTap: {},
                    ) {
                        Task { await viewModel.claimOpening() }
                    }
                }
            }
        }
    }

    private func offerDetailStatusBanner(uiState: OfferDetailUIState) -> some View {
        PFCustomerSectionCard(variant: statusBannerVariant(uiState), padding: 16) {
            VStack(alignment: .leading, spacing: 8) {
                Text(uiState.bannerTitle)
                    .font(.system(size: 20, weight: .bold))
                    .foregroundStyle(PFColor.textPrimary)

                Text(uiState.bannerMessage)
                    .font(.system(size: 15, weight: .medium))
                    .foregroundStyle(PFColor.textSecondary)
                    .lineSpacing(3)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    private func statusBannerVariant(_ uiState: OfferDetailUIState) -> PFCustomerSectionVariant {
        switch uiState {
        case .claiming, .waitingForConfirmation:
            return .attention
        case .confirmed:
            return .elevated
        case .available:
            return .default
        case .expired, .unavailable, .taken:
            return .quiet
        case .unknown:
            return .default
        }
    }

    private func offerBusinessServiceCard(offer: CustomerOfferDetail, pillStatus: CustomerOfferDisplayStatus) -> some View {
        CustomerAppointmentPassCard {
            VStack(alignment: .leading, spacing: 16) {
                HStack {
                    Spacer()
                    CustomerStatusPill(text: pillStatus.label, tone: pillStatus.pillToneOnPass)
                        .customerStatusPillPulse(trigger: statusPulseTick)
                }

                Text(CustomerOfferDetailCopy.serviceLine(for: offer))
                    .font(.system(size: 28, weight: .bold))
                    .foregroundStyle(PFColor.passTitle)
                    .lineLimit(2)
                    .minimumScaleFactor(0.82)

                Text(CustomerOfferDetailCopy.clinicLine(for: offer))
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundStyle(PFColor.customerTextSecondary)

                if let p = offer.providerName?.trimmingCharacters(in: .whitespacesAndNewlines), !p.isEmpty {
                    Label(p, systemImage: "person")
                        .font(.system(size: 14, weight: .medium))
                        .foregroundStyle(PFColor.textMuted)
                }
            }
        }
    }

    private func offerTimeLocationCard(offer: CustomerOfferDetail) -> some View {
        PFCustomerSectionCard(variant: .default) {
            VStack(alignment: .leading, spacing: 12) {
                PFTypography.Customer.label("Opening time")
                if let startsAt = offer.startsAt {
                    Label(
                        DateFormatterPF.dateTimeRange(start: startsAt, end: offer.endsAt),
                        systemImage: "calendar",
                    )
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundStyle(PFColor.textPrimary)
                } else {
                    Text("See details from your clinic")
                        .font(.system(size: 16, weight: .medium))
                        .foregroundStyle(PFColor.textSecondary)
                }

                if let loc = offer.locationName?.trimmingCharacters(in: .whitespacesAndNewlines), !loc.isEmpty {
                    Label(loc, systemImage: "mappin.and.ellipse")
                        .font(.system(size: 15, weight: .medium))
                        .foregroundStyle(PFColor.textSecondary)
                }
            }
        }
    }

    private func offerWhyReceivedCard(uiState: OfferDetailUIState, offer: CustomerOfferDetail) -> some View {
        PFCustomerInfoCallout(
            title: "Why you received this",
            message: uiState.whyReceivedParagraph(offer: offer),
            variant: .neutral,
        )
    }

    private func offerNextStepCard(uiState: OfferDetailUIState, offer: CustomerOfferDetail) -> some View {
        PFCustomerInfoCallout(
            title: uiState.nextStepTitle,
            message: uiState.nextStepBody(fallbackGuidance: offer.claimGuidance),
            variant: uiState == .available ? .attention : .neutral,
        )
    }
}
