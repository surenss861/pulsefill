import SwiftUI

/// Weekday indices match API `days_of_week`: 0 = Sunday … 6 = Saturday.
struct DayOfWeekPillSelector: View {
    @Binding var selectedDays: Set<Int>

    /// Mon-first row for quick scanning; indices stay API-correct.
    private let orderedDays: [(Int, String)] = [
        (1, "Mon"),
        (2, "Tue"),
        (3, "Wed"),
        (4, "Thu"),
        (5, "Fri"),
        (6, "Sat"),
        (0, "Sun"),
    ]

    var body: some View {
        LazyVGrid(
            columns: [
                GridItem(.flexible(), spacing: 8),
                GridItem(.flexible(), spacing: 8),
                GridItem(.flexible(), spacing: 8),
                GridItem(.flexible(), spacing: 8),
            ],
            spacing: 8
        ) {
            ForEach(orderedDays, id: \.0) { day, label in
                let isSelected = selectedDays.contains(day)
                Button {
                    toggle(day)
                } label: {
                    Text(label)
                        .font(.system(size: 13, weight: .semibold))
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 12)
                        .background(isSelected ? PFColor.primary.opacity(0.18) : Color.white.opacity(0.06))
                        .foregroundStyle(isSelected ? PFColor.primary : PFColor.textPrimary)
                        .overlay(
                            RoundedRectangle(cornerRadius: 14, style: .continuous)
                                .stroke(isSelected ? PFColor.primary.opacity(0.35) : Color.white.opacity(0.08), lineWidth: 1)
                        )
                        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                }
                .buttonStyle(.plain)
            }
        }
    }

    private func toggle(_ day: Int) {
        if selectedDays.contains(day) {
            selectedDays.remove(day)
        } else {
            selectedDays.insert(day)
        }
    }
}
