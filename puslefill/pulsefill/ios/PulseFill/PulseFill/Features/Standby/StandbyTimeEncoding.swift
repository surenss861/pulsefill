import Foundation

enum StandbyTimeEncoding {
    static func hm(_ date: Date) -> String {
        let f = DateFormatter()
        f.locale = Locale(identifier: "en_US_POSIX")
        f.timeZone = TimeZone.current
        f.dateFormat = "HH:mm"
        return f.string(from: date)
    }

    /// Parses `HH:mm` or `HH:mm:ss` from the API using today’s calendar date in the current time zone.
    static func dateFromClockString(_ raw: String?) -> Date? {
        guard let raw = raw?.trimmingCharacters(in: .whitespacesAndNewlines), !raw.isEmpty else { return nil }
        let parts = raw.split(separator: ":")
        guard parts.count >= 2,
              let h = Int(parts[0]),
              let m = Int(String(parts[1]).prefix(2))
        else { return nil }
        let cal = Calendar.current
        let base = Date()
        var dc = cal.dateComponents([.year, .month, .day], from: base)
        dc.hour = h
        dc.minute = m
        return cal.date(from: dc)
    }
}
