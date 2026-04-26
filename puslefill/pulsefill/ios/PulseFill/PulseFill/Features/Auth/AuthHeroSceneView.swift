import SceneKit
import SwiftUI

struct AuthHeroSceneView: UIViewRepresentable {
    let reduceMotion: Bool

    func makeCoordinator() -> AuthHeroSceneCoordinator {
        AuthHeroSceneCoordinator(reduceMotion: reduceMotion)
    }

    func makeUIView(context: Context) -> SCNView {
        let view = SCNView()
        view.backgroundColor = .clear
        view.allowsCameraControl = false
        view.autoenablesDefaultLighting = false
        view.isUserInteractionEnabled = false
        view.scene = context.coordinator.makeScene()
        return view
    }

    func updateUIView(_ uiView: SCNView, context: Context) {
        context.coordinator.updateReduceMotion(reduceMotion)
        if uiView.scene == nil {
            uiView.scene = context.coordinator.makeScene()
        }
    }
}
