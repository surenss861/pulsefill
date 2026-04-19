import Foundation

extension DateFormatter {
    static let pfShortDateTime: DateFormatter = {
        let f = DateFormatter()
        f.dateStyle = .medium
        f.timeStyle = .short
        return f
    }()
}

enum DateFormatterPF {
    private static let iso = ISO8601DateFormatter()
    private static let isoFrac: ISO8601DateFormatter = {
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return f
    }()

    private static func parse(_ string: String) -> Date? {
        if let d = isoFrac.date(from: string) { return d }
        if let d = iso.date(from: string) { return d }
        let f = DateFormatter()
        f.locale = Locale(identifier: "en_US_POSIX")
        f.timeZone = TimeZone(secondsFromGMT: 0)
        f.dateFormat = "yyyy-MM-dd'T'HH:mm:ss.SSSXXXXX"
        return f.date(from: string)
    }

    static func short(_ iso: String) -> String {
        guard let date = parse(iso) else { return iso }
        let f = DateFormatter()
        f.dateStyle = .medium
        f.timeStyle = .none
        return f.string(from: date)
    }

    static func time(_ iso: String) -> String {
        guard let date = parse(iso) else { return iso }
        let f = DateFormatter()
        f.dateStyle = .none
        f.timeStyle = .short
        return f.string(from: date)
    }

    static func medium(_ iso: String) -> String {
        guard let date = parse(iso) else { return iso }
        let f = DateFormatter()
        f.dateStyle = .medium
        f.timeStyle = .short
        return f.string(from: date)
    }

    /// Same-day range for operator lists (local timezone).
    static func dateTimeRange(start: String, end: String?) -> String {
        guard let s = parse(start) else { return start }
        let dateFmt = DateFormatter()
        dateFmt.dateStyle = .medium
        dateFmt.timeStyle = .none
        let timeFmt = DateFormatter()
        timeFmt.dateStyle = .none
        timeFmt.timeStyle = .short
        guard let eStr = end, let e = parse(eStr) else {
            return "\(dateFmt.string(from: s)) · \(timeFmt.string(from: s))"
        }
        if Calendar.current.isDate(s, inSameDayAs: e) {
            return "\(dateFmt.string(from: s)) · \(timeFmt.string(from: s))–\(timeFmt.string(from: e))"
        }
        return "\(medium(start)) → \(medium(eStr))"
    }
}
