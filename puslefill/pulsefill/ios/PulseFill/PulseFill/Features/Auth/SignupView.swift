import SwiftUI

struct SignUpView: View {
    var body: some View {
        AuthFormView(initialMode: .signUp)
    }
}

/// Legacy name used by older navigation; same surface as `SignUpView`.
struct SignupView: View {
    var body: some View {
        AuthFormView(initialMode: .signUp)
    }
}
