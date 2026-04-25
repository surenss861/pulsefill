import SwiftUI

struct PFSectionCard<Content: View>: View {
    var eyebrow: String? = nil
    var title: String? = nil
    var description: String? = nil
    var borderColor: Color = Color.white.opacity(0.10)
    @ViewBuilder var content: () -> Content

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            if eyebrow != nil || title != nil || description != nil {
                VStack(alignment: .leading, spacing: 6) {
                    if let eyebrow {
                        Text(eyebrow.uppercased())
                            .font(.system(size: 11, weight: .semibold))
                            .kerning(0.8)
                            .foregroundStyle(PFColor.textSecondary)
                    }
                    if let title {
                        Text(title)
                            .font(.system(size: 18, weight: .semibold))
                            .foregroundStyle(PFColor.textPrimary)
                    }
                    if let description, !description.isEmpty {
                        Text(description)
                            .font(.system(size: 14))
                            .foregroundStyle(PFColor.textSecondary)
                    }
                }
            }
            content()
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(PFSurface.card)
        .overlay(
            RoundedRectangle(cornerRadius: PFRadius.card, style: .continuous)
                .stroke(borderColor, lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: PFRadius.card, style: .continuous))
    }
}
