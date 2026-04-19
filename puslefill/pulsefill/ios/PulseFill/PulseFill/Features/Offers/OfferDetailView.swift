import SwiftUI

struct OfferDetailView: View {
    @EnvironmentObject private var env: AppEnvironment
    let offer: OfferInboxItem

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: PFSpacing.md) {
                PFTypography.title(offer.openSlot?.providerNameSnapshot ?? "Earlier appointment")
                PFTypography.caption(dateLine)

                if let cents = offer.openSlot?.estimatedValueCents {
                    PFTypography.body(CurrencyFormatter.currency(cents: cents))
                        .foregroundStyle(PFColor.primary)
                }

                PFTypography.caption("Channel: \(offer.channel.capitalized)")
                PFTypography.caption("Status: \(offer.status.capitalized)")

                if let exp = offer.expiresAt {
                    PFTypography.caption("Expires: \(DateFormatterPF.medium(exp))")
                }

                if let notes = offer.openSlot?.notes, !notes.isEmpty {
                    PFSurfaceCard {
                        VStack(alignment: .leading, spacing: PFSpacing.sm) {
                            Text("Notes").font(.system(size: 13, weight: .semibold))
                            Text(notes).font(.system(size: 15))
                        }
                    }
                }

                let canClaim = offer.status.lowercased() == "sent" || offer.status.lowercased() == "delivered"
                    || offer.status.lowercased() == "viewed"

                NavigationLink {
                    ClaimSlotView(openSlotId: offer.openSlotId)
                } label: {
                    Text("Claim this slot")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(PFPrimaryButtonStyle())
                .disabled(!canClaim)
            }
            .padding(PFSpacing.lg)
        }
        .background(PFColor.background.ignoresSafeArea())
        .navigationTitle("Offer")
        .navigationBarTitleDisplayMode(.inline)
    }

    private var dateLine: String {
        guard let slot = offer.openSlot else { return "Pending details" }
        return "\(DateFormatterPF.medium(slot.startsAt)) • \(DateFormatterPF.time(slot.startsAt))–\(DateFormatterPF.time(slot.endsAt))"
    }
}
