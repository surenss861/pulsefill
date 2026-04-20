import SwiftUI

struct CustomerActivityFilterBar: View {
    @Binding var selected: CustomerActivityFilter

    var body: some View {
        Picker("Activity Filter", selection: $selected) {
            ForEach(CustomerActivityFilter.allCases) { filter in
                Text(filter.rawValue).tag(filter)
            }
        }
        .pickerStyle(.segmented)
    }
}
