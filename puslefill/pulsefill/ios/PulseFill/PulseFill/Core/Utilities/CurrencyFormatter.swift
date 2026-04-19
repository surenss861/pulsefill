import Foundation

enum CurrencyFormatter {
    /// Alias for offer value display (same as USD until multi-currency is modeled).
    static func currency(cents: Int) -> String {
        usd(cents: cents)
    }

    static func usd(cents: Int) -> String {
        let n = NSDecimalNumber(value: Double(cents) / 100)
        let f = NumberFormatter()
        f.numberStyle = .currency
        f.currencyCode = "USD"
        return f.string(from: n) ?? "$0.00"
    }
}
