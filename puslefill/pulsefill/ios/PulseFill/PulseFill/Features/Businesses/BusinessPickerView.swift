import SwiftUI

struct BusinessPickerView: View {
    var body: some View {
        List {
            Text("Demo Med Spa").foregroundStyle(PFColor.textPrimary)
            Text("Wire GET /v1/businesses/mine from staff app, or curated discovery list for customers.")
                .font(.footnote)
                .foregroundStyle(PFColor.textSecondary)
        }
        .scrollContentBackground(.hidden)
        .background(PFColor.background)
        .navigationTitle("Businesses")
    }
}
