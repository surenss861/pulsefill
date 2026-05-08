import SwiftUI

/// Tabs inside `BusinessTabView` — used to jump from Business Today quick actions.
enum BusinessShellTab: Hashable {
    case today
    case openings
    case create
    case claims
    case more
}

/// Destinations pushed from the **More** hub (customers directory / account).
enum BusinessMoreRoute: Hashable {
    case customers
    case account
}
