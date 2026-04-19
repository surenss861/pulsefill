import SwiftUI

struct EmptyStateView: View {
    let title: String
    let message: String
    var actionTitle: String?
    var action: (() -> Void)?

    var body: some View {
        VStack(alignment: .leading, spacing: PFSpacing.md) {
            PFTypography.title(title)
            PFTypography.caption(message)
            if let actionTitle, let action {
                Button(actionTitle, action: action).buttonStyle(PFPrimaryButtonStyle())
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(PFSpacing.lg)
    }
}
