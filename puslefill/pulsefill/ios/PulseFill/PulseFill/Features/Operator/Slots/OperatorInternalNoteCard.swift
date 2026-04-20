import SwiftUI

struct OperatorInternalNoteCard: View {
    let initialNote: String?
    let initialResolution: String?
    let initialUpdatedAt: String?
    let isSaving: Bool
    let onSave: (String, String) -> Void

    @State private var draftNote: String = ""
    @State private var draftStatus: OperatorResolutionStatus = .none

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("INTERNAL NOTE")
                .font(.system(size: 11, weight: .semibold))
                .foregroundStyle(PFColor.textSecondary)

            Text("Visible to staff only. Use for handoff and how this slot was handled.")
                .font(.system(size: 13))
                .foregroundStyle(PFColor.textSecondary)

            Text("Resolution")
                .font(.system(size: 12))
                .foregroundStyle(PFColor.textSecondary)

            Picker("Resolution", selection: $draftStatus) {
                ForEach(OperatorResolutionStatus.allCases) { status in
                    Text(status.label).tag(status)
                }
            }
            .pickerStyle(.menu)
            .tint(PFColor.primary)

            Text("Note")
                .font(.system(size: 12))
                .foregroundStyle(PFColor.textSecondary)

            TextField("e.g. Customer called front desk — handled outside PulseFill.", text: $draftNote, axis: .vertical)
                .textFieldStyle(.plain)
                .lineLimit(3 ... 8)
                .padding(12)
                .background(PFColor.surface2)
                .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
                .overlay(
                    RoundedRectangle(cornerRadius: 10, style: .continuous)
                        .stroke(PFColor.primary.opacity(0.12), lineWidth: 1)
                )

            HStack(spacing: 12) {
                Button(isSaving ? "Saving…" : "Save") {
                    onSave(draftNote, draftStatus.rawValue)
                }
                .buttonStyle(.borderedProminent)
                .tint(PFColor.primaryDark)
                .disabled(isSaving)

                if let line = updatedLine {
                    Text(line)
                        .font(.system(size: 12))
                        .foregroundStyle(PFColor.textSecondary)
                }
            }
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(PFSurface.card)
        .overlay(
            RoundedRectangle(cornerRadius: PFRadius.card, style: .continuous)
                .stroke(PFColor.primary.opacity(0.12), lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: PFRadius.card, style: .continuous))
        .onAppear {
            syncFromServer()
        }
        .onChange(of: initialUpdatedAt ?? "") { _, _ in
            syncFromServer()
        }
    }

    private var updatedLine: String? {
        guard let initialUpdatedAt, !initialUpdatedAt.isEmpty else { return nil }
        return "Last updated \(DateFormatterPF.medium(initialUpdatedAt))"
    }

    private func syncFromServer() {
        draftNote = initialNote ?? ""
        draftStatus = OperatorResolutionStatus.from(apiValue: initialResolution)
    }
}
