import SwiftUI

struct PrimaryCTAButton: View {
    let title: String
    let action: () -> Void

    var body: some View {
        Button(title, action: action).buttonStyle(PFPrimaryButtonStyle())
    }
}
