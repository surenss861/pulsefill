import SwiftUI

struct PFPageHeader: View {
    let overline: String
    let title: String
    let subtitle: String
    var showLivePulse: Bool = true

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 8) {
                if showLivePulse { PFLivePulseDot() }
                Text(overline.uppercased())
                    .font(.system(size: 11, weight: .semibold))
                    .kerning(0.9)
                    .foregroundStyle(PFColor.textSecondary)
            }
            Text(title)
                .font(.system(size: 28, weight: .semibold))
                .foregroundStyle(PFColor.textPrimary)
            Text(subtitle)
                .font(.system(size: 14))
                .foregroundStyle(PFColor.textSecondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(20)
        .background(PFColor.surface1)
        .overlay(
            RoundedRectangle(cornerRadius: PFRadius.sheet, style: .continuous)
                .stroke(Color.white.opacity(0.10), lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: PFRadius.sheet, style: .continuous))
    }
}
