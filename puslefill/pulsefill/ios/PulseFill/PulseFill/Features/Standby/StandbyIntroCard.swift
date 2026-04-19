import SwiftUI

struct StandbyIntroCard: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Get earlier appointments automatically")
                .font(.system(size: 24, weight: .semibold))
                .foregroundStyle(PFColor.textPrimary)

            Text(
                "Pick the services and times you want. If an earlier opening matches you, PulseFill will notify you right away so you can claim it before someone else does."
            )
            .font(.system(size: 17, weight: .regular))
            .foregroundStyle(PFColor.textSecondary)
            .fixedSize(horizontal: false, vertical: true)
        }
        .padding(20)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(PFSurface.card)
        .clipShape(RoundedRectangle(cornerRadius: PFRadius.card, style: .continuous))
    }
}
