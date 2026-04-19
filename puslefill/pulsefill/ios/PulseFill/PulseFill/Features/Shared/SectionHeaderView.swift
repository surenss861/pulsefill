import SwiftUI

struct SectionHeaderView: View {
    let title: String
    var body: some View {
        Text(title)
            .font(.system(size: 20, weight: .semibold))
            .foregroundStyle(PFColor.textPrimary)
            .frame(maxWidth: .infinity, alignment: .leading)
    }
}
