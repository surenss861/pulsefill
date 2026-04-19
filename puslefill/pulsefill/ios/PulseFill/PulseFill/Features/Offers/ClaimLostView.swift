import SwiftUI

struct ClaimLostView: View {
    var body: some View {
        VStack(spacing: PFSpacing.lg) {
            Image(systemName: "exclamationmark.triangle.fill")
                .font(.system(size: 48))
                .foregroundStyle(PFColor.warning)
            PFTypography.title("Someone else got it")
            PFTypography.caption("Keep notifications on for the next opening.")
        }
        .padding(PFSpacing.xl)
        .navigationTitle("Missed")
    }
}
