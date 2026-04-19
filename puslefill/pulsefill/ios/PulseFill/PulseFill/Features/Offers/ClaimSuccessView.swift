import SwiftUI

struct ClaimSuccessView: View {
    var body: some View {
        VStack(spacing: PFSpacing.lg) {
            Image(systemName: "checkmark.circle.fill")
                .font(.system(size: 56))
                .foregroundStyle(PFColor.success)
            PFTypography.title("You’re in")
            PFTypography.caption("The business will confirm shortly.")
        }
        .padding(PFSpacing.xl)
        .navigationTitle("Confirmed")
    }
}
