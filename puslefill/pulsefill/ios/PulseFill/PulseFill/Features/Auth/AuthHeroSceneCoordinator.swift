import SceneKit
import UIKit

final class AuthHeroSceneCoordinator {
    private let floatActionKey = "auth-hero-float"
    private let rotateActionKey = "auth-hero-rotate"
    private var rootNode: SCNNode?
    private var reduceMotion: Bool

    init(reduceMotion: Bool) {
        self.reduceMotion = reduceMotion
    }

    func updateReduceMotion(_ value: Bool) {
        reduceMotion = value
        guard let rootNode else { return }
        if value {
            rootNode.removeAction(forKey: floatActionKey)
            rootNode.removeAction(forKey: rotateActionKey)
        } else {
            applyMotion(to: rootNode)
        }
    }

    func makeScene() -> SCNScene {
        let scene = SCNScene()

        let cameraNode = SCNNode()
        let camera = SCNCamera()
        camera.fieldOfView = 40
        camera.zNear = 0.1
        camera.zFar = 100
        cameraNode.camera = camera
        cameraNode.position = SCNVector3(0, 0.08, 6.1)
        scene.rootNode.addChildNode(cameraNode)

        let ambient = SCNLight()
        ambient.type = .ambient
        ambient.intensity = 210
        ambient.color = UIColor.white.withAlphaComponent(0.52)
        let ambientNode = SCNNode()
        ambientNode.light = ambient
        scene.rootNode.addChildNode(ambientNode)

        let key = SCNLight()
        key.type = .omni
        key.intensity = 620
        key.color = UIColor(red: 1.0, green: 0.45, blue: 0.16, alpha: 1)
        let keyNode = SCNNode()
        keyNode.light = key
        keyNode.position = SCNVector3(2.1, 2.3, 3.2)
        scene.rootNode.addChildNode(keyNode)

        let fill = SCNLight()
        fill.type = .omni
        fill.intensity = 310
        fill.color = UIColor(red: 0.44, green: 0.56, blue: 0.78, alpha: 1)
        let fillNode = SCNNode()
        fillNode.light = fill
        fillNode.position = SCNVector3(-2.4, 1.6, 2.8)
        scene.rootNode.addChildNode(fillNode)

        let root = SCNNode()
        root.position = SCNVector3(0, -0.04, 0)
        root.eulerAngles = SCNVector3(-0.06, 0.16, -0.01)
        scene.rootNode.addChildNode(root)
        rootNode = root

        root.addChildNode(mainCard())
        addMetricTile(on: root, x: -1.15, y: 0.42)
        addMetricTile(on: root, x: 0.0, y: 0.42)
        addMetricTile(on: root, x: 1.15, y: 0.42)

        let phone = phonePanel()
        phone.position = SCNVector3(1.25, -0.3, 0.43)
        phone.eulerAngles = SCNVector3(0.01, -0.12, 0.016)
        root.addChildNode(phone)

        if !reduceMotion {
            applyMotion(to: root)
        }
        return scene
    }

    private func applyMotion(to node: SCNNode) {
        guard node.action(forKey: floatActionKey) == nil else { return }
        let float = SCNAction.sequence([
            .moveBy(x: 0, y: 0.07, z: 0, duration: 2.8),
            .moveBy(x: 0, y: -0.07, z: 0, duration: 2.8),
        ])
        float.timingMode = .easeInEaseOut
        node.runAction(.repeatForever(float), forKey: floatActionKey)

        let rotate = SCNAction.sequence([
            .rotateBy(x: 0, y: 0.03, z: 0.005, duration: 3.3),
            .rotateBy(x: 0, y: -0.03, z: -0.005, duration: 3.3),
        ])
        rotate.timingMode = .easeInEaseOut
        node.runAction(.repeatForever(rotate), forKey: rotateActionKey)
    }

    private func mainCard() -> SCNNode {
        let geometry = SCNBox(width: 4.7, height: 2.4, length: 0.12, chamferRadius: 0.18)
        geometry.materials = [material(
            diffuse: UIColor(red: 0.05, green: 0.065, blue: 0.095, alpha: 0.96),
            emission: UIColor(red: 0.08, green: 0.12, blue: 0.2, alpha: 0.08),
            metalness: 0.22,
            roughness: 0.62
        )]
        let node = SCNNode(geometry: geometry)

        let border = SCNBox(width: 4.78, height: 2.48, length: 0.022, chamferRadius: 0.2)
        border.materials = [material(
            diffuse: UIColor(red: 1.0, green: 0.46, blue: 0.17, alpha: 0.10),
            emission: UIColor(red: 1.0, green: 0.36, blue: 0.12, alpha: 0.11),
            metalness: 0.35,
            roughness: 0.42
        )]
        let borderNode = SCNNode(geometry: border)
        borderNode.position = SCNVector3(0, 0, -0.022)
        node.addChildNode(borderNode)

        let gloss = SCNPlane(width: 4.4, height: 1.0)
        gloss.materials = [material(
            diffuse: UIColor.white.withAlphaComponent(0.035),
            emission: UIColor.white.withAlphaComponent(0.01),
            metalness: 0.0,
            roughness: 1.0
        )]
        let glossNode = SCNNode(geometry: gloss)
        glossNode.position = SCNVector3(0, 0.46, 0.07)
        glossNode.eulerAngles = SCNVector3(-0.42, 0, 0)
        node.addChildNode(glossNode)
        return node
    }

    private func phonePanel() -> SCNNode {
        let group = SCNNode()
        let phone = SCNBox(width: 1.1, height: 1.8, length: 0.11, chamferRadius: 0.2)
        phone.materials = [material(
            diffuse: UIColor(red: 0.03, green: 0.06, blue: 0.11, alpha: 1),
            emission: UIColor(red: 0.05, green: 0.12, blue: 0.2, alpha: 0.09),
            metalness: 0.28,
            roughness: 0.58
        )]
        group.addChildNode(SCNNode(geometry: phone))

        let screen = SCNPlane(width: 0.88, height: 1.5)
        screen.materials = [material(
            diffuse: UIColor(red: 0.06, green: 0.08, blue: 0.13, alpha: 0.92),
            emission: UIColor(red: 0.08, green: 0.10, blue: 0.16, alpha: 0.08),
            metalness: 0.02,
            roughness: 0.95
        )]
        let screenNode = SCNNode(geometry: screen)
        screenNode.position = SCNVector3(0, 0, 0.062)
        group.addChildNode(screenNode)

        let button = SCNBox(width: 0.58, height: 0.18, length: 0.028, chamferRadius: 0.06)
        button.materials = [material(
            diffuse: UIColor(red: 1.0, green: 0.44, blue: 0.12, alpha: 0.92),
            emission: UIColor(red: 1.0, green: 0.25, blue: 0.08, alpha: 0.16),
            metalness: 0.08,
            roughness: 0.55
        )]
        let buttonNode = SCNNode(geometry: button)
        buttonNode.position = SCNVector3(0, -0.54, 0.09)
        group.addChildNode(buttonNode)
        return group
    }

    private func addMetricTile(on root: SCNNode, x: Float, y: Float) {
        let tile = SCNBox(width: 0.96, height: 0.52, length: 0.04, chamferRadius: 0.09)
        tile.materials = [material(
            diffuse: UIColor.white.withAlphaComponent(0.065),
            emission: UIColor(red: 0.95, green: 0.45, blue: 0.16, alpha: 0.04),
            metalness: 0.09,
            roughness: 0.84
        )]
        let tileNode = SCNNode(geometry: tile)
        tileNode.position = SCNVector3(x, y, 0.09)
        root.addChildNode(tileNode)
    }

    private func material(diffuse: UIColor, emission: UIColor, metalness: CGFloat, roughness: CGFloat) -> SCNMaterial {
        let mat = SCNMaterial()
        mat.diffuse.contents = diffuse
        mat.emission.contents = emission
        mat.metalness.contents = metalness
        mat.roughness.contents = roughness
        mat.lightingModel = .physicallyBased
        mat.isDoubleSided = true
        return mat
    }
}
