import SwiftUI

struct ProfileRow: View {
    let title: String
    let subtitle: String?

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(title)
                .font(.system(size: 17, weight: .semibold))
                .foregroundStyle(PFColor.textPrimary)

            if let subtitle, !subtitle.isEmpty {
                Text(subtitle)
                    .font(.system(size: 13, weight: .regular))
                    .foregroundStyle(PFColor.textSecondary)
            }
        }
        .padding(.vertical, 2)
    }
}
