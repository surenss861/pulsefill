import SwiftUI

/// Quick-create a staff opening — Business mode **Create** tab.
struct OperatorCreateOpeningView: View {
    @EnvironmentObject private var env: AppEnvironment
    @StateObject private var viewModel: OperatorCreateOpeningViewModel
    @State private var path = NavigationPath()

    init(businessAPI: BusinessOperatorAPIClient) {
        _viewModel = StateObject(wrappedValue: OperatorCreateOpeningViewModel(businessAPI: businessAPI))
    }

    var body: some View {
        NavigationStack(path: $path) {
            Group {
                switch viewModel.loadState {
                case .idle, .loading:
                    loadingBody
                case let .failed(message):
                    errorBody(message)
                case .loaded:
                    formScroll
                }
            }
            .background(PFScreenBackground())
            .navigationTitle("Add opening")
            .navigationBarTitleDisplayMode(.inline)
            .toolbarBackground(PFColor.surface1, for: .navigationBar)
            .toolbarColorScheme(.dark, for: .navigationBar)
            .navigationDestination(for: String.self) { slotId in
                OperatorSlotDetailView(
                    businessAPI: env.businessOperatorAPI,
                    slotId: slotId,
                    showCreatedSuccessBanner: true
                )
            }
            .task {
                if case .idle = viewModel.loadState {
                    await viewModel.loadReferenceData()
                }
            }
            .onChange(of: viewModel.navigateToCreatedSlotId) { _, newId in
                guard let id = newId, !id.isEmpty else { return }
                path.append(id)
                viewModel.consumeNavigationSlotId()
            }
            .alert(
                "Notice",
                isPresented: Binding(
                    get: { viewModel.banner != nil },
                    set: { if !$0 { viewModel.banner = nil } }
                ),
                actions: { Button("OK", role: .cancel) {} },
                message: { Text(viewModel.banner ?? "") }
            )
        }
    }

    private var loadingBody: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                OperatorListLoadingPlaceholder(
                    title: "Loading form…",
                    subtitle: "We need your services and locations before you can add an opening.",
                    skeletonCount: 3
                )
            }
            .padding(.horizontal, 20)
            .padding(.top, 24)
        }
    }

    private func errorBody(_ message: String) -> some View {
        VStack(spacing: 16) {
            Spacer()
            PFOperatorErrorMoment(
                title: "Couldn’t load form",
                message: "We need your services and locations before you can post an opening. Try again.",
                technicalMessage: message,
                actionTitle: "Reload form",
                footerHint: "If this keeps failing, check your connection or try again later.",
                onAction: { await viewModel.loadReferenceData() }
            )
            .padding(.horizontal, 20)
            Spacer()
        }
    }

    private var formScroll: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                BusinessWorkspaceStrip()
                    .environmentObject(env)

                PFOperatorHero(
                    overline: "Create",
                    title: "Add an empty appointment",
                    subtitle: "Then send offers so waiting customers can claim it. You confirm the booking in Claims."
                )
                .padding(.top, 8)

                PFCustomerSectionCard(variant: .quiet, padding: 18) {
                    VStack(alignment: .leading, spacing: 14) {
                        sectionTitle("When is it?")
                        DatePicker("Date", selection: $viewModel.appointmentDate, displayedComponents: .date)
                            .tint(PFColor.ember)
                        DatePicker("Start time", selection: $viewModel.startTime, displayedComponents: .hourAndMinute)
                            .tint(PFColor.ember)

                        Toggle("Set end time myself", isOn: $viewModel.useCustomEnd)
                            .tint(PFColor.ember)
                            .font(.system(size: 15, weight: .medium))

                        if viewModel.useCustomEnd {
                            DatePicker("End time", selection: $viewModel.customEndTime, displayedComponents: .hourAndMinute)
                                .tint(PFColor.ember)
                        } else {
                            Text("How long is it?")
                                .font(.system(size: 13, weight: .semibold))
                                .foregroundStyle(PFColor.textSecondary)
                            HStack(spacing: 8) {
                                ForEach([30, 45, 60, 90], id: \.self) { mins in
                                    durationChip(mins)
                                }
                            }
                        }
                    }
                }

                PFCustomerSectionCard(variant: .quiet, padding: 18) {
                    VStack(alignment: .leading, spacing: 14) {
                        sectionTitle("What is it?")
                        namedPicker("Service", viewModel.serviceOptions, selection: $viewModel.selectedServiceId)
                        namedPicker("Provider (optional)", viewModel.providerOptions, selection: $viewModel.selectedProviderId, allowClear: true)
                        namedPicker("Location (optional)", viewModel.locationOptions, selection: $viewModel.selectedLocationId, allowClear: true)
                    }
                }

                PFCustomerSectionCard(variant: .quiet, padding: 18) {
                    VStack(alignment: .leading, spacing: 14) {
                        sectionTitle("Optional details")
                        VStack(alignment: .leading, spacing: 6) {
                            Text("Estimated value (optional)")
                                .font(.system(size: 13, weight: .semibold))
                                .foregroundStyle(PFColor.textSecondary)
                            TextField("e.g. 85", text: $viewModel.estimatedValueDollarsText)
                                .keyboardType(.decimalPad)
                                .textFieldStyle(.plain)
                                .padding(12)
                                .background(PFColor.customerCard.opacity(0.6))
                                .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                                .overlay(
                                    RoundedRectangle(cornerRadius: 12, style: .continuous)
                                        .stroke(PFColor.hairline, lineWidth: 1)
                                )
                        }
                        VStack(alignment: .leading, spacing: 6) {
                            Text("Staff note (optional)")
                                .font(.system(size: 13, weight: .semibold))
                                .foregroundStyle(PFColor.textSecondary)
                            TextField("Note for your team only", text: $viewModel.internalNote, axis: .vertical)
                                .lineLimit(3 ... 6)
                                .textFieldStyle(.plain)
                                .padding(12)
                                .background(PFColor.customerCard.opacity(0.6))
                                .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                                .overlay(
                                    RoundedRectangle(cornerRadius: 12, style: .continuous)
                                        .stroke(PFColor.hairline, lineWidth: 1)
                                )
                        }
                    }
                }

                if let v = viewModel.validationMessage {
                    Text(v)
                        .font(.system(size: 14, weight: .medium))
                        .foregroundStyle(PFColor.error)
                        .fixedSize(horizontal: false, vertical: true)
                }

                PFCustomerPrimaryButton(
                    title: "Create opening",
                    isEnabled: !viewModel.isSubmitting,
                    isLoading: viewModel.isSubmitting
                ) {
                    Task { await viewModel.submit() }
                }
            }
            .padding(.horizontal, 20)
            .pfOperatorTabBarContentInset()
        }
    }

    private func sectionTitle(_ text: String) -> some View {
        Text(text)
            .font(.system(size: 16, weight: .semibold))
            .foregroundStyle(PFColor.textPrimary)
    }

    private func durationChip(_ minutes: Int) -> some View {
        let selected = !viewModel.useCustomEnd && viewModel.selectedDurationMinutes == minutes
        return Button {
            viewModel.applyDurationPreset(minutes)
        } label: {
            Text("\(minutes)m")
                .font(.system(size: 14, weight: .semibold))
                .foregroundStyle(selected ? PFColor.primaryText : PFColor.textPrimary)
                .padding(.horizontal, 12)
                .padding(.vertical, 8)
                .background(
                    Capsule().fill(selected ? PFColor.ember.opacity(0.35) : PFColor.customerCard.opacity(0.5))
                )
                .overlay(
                    Capsule().stroke(selected ? PFColor.ember.opacity(0.6) : PFColor.hairline, lineWidth: 1)
                )
        }
        .buttonStyle(.plain)
    }

    private func namedPicker(
        _ title: String,
        _ options: [BusinessNamedRow],
        selection: Binding<String?>,
        allowClear: Bool = false
    ) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(title)
                .font(.system(size: 13, weight: .semibold))
                .foregroundStyle(PFColor.textSecondary)
            Picker(title, selection: selection) {
                if allowClear {
                    Text("None").tag(String?.none)
                }
                ForEach(options, id: \.id) { row in
                    Text(row.name).tag(Optional(row.id))
                }
            }
            .pickerStyle(.menu)
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(12)
            .background(PFColor.customerCard.opacity(0.55))
            .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 12, style: .continuous)
                    .stroke(PFColor.hairline, lineWidth: 1)
            )
        }
    }
}
