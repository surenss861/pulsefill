import MetalKit
import QuartzCore
import SwiftUI

struct AuthMetalBackgroundView: UIViewRepresentable {
    let reduceMotion: Bool

    func makeCoordinator() -> Coordinator {
        Coordinator(reduceMotion: reduceMotion)
    }

    func makeUIView(context: Context) -> MTKView {
        let view = MTKView()
        view.device = MTLCreateSystemDefaultDevice()
        view.framebufferOnly = false
        view.enableSetNeedsDisplay = false
        view.isPaused = false
        view.preferredFramesPerSecond = reduceMotion ? 24 : 60
        view.clearColor = MTLClearColor(red: 0.08, green: 0.05, blue: 0.042, alpha: 1)
        context.coordinator.configure(view: view)
        view.delegate = context.coordinator
        return view
    }

    func updateUIView(_ uiView: MTKView, context: Context) {
        context.coordinator.reduceMotion = reduceMotion
        uiView.preferredFramesPerSecond = reduceMotion ? 24 : 60
    }

    final class Coordinator: NSObject, MTKViewDelegate {
        var reduceMotion: Bool

        private var pipelineState: MTLRenderPipelineState?
        private var commandQueue: MTLCommandQueue?
        private var startTime = CACurrentMediaTime()

        init(reduceMotion: Bool) {
            self.reduceMotion = reduceMotion
            super.init()
        }

        func configure(view: MTKView) {
            guard
                let device = view.device,
                let commandQueue = device.makeCommandQueue(),
                let library = device.makeDefaultLibrary(),
                let vertexFn = library.makeFunction(name: "authLandingVertex"),
                let fragmentFn = library.makeFunction(name: "authLandingFragment")
            else { return }

            self.commandQueue = commandQueue

            let descriptor = MTLRenderPipelineDescriptor()
            descriptor.vertexFunction = vertexFn
            descriptor.fragmentFunction = fragmentFn
            descriptor.colorAttachments[0].pixelFormat = view.colorPixelFormat
            pipelineState = try? device.makeRenderPipelineState(descriptor: descriptor)
        }

        func mtkView(_: MTKView, drawableSizeWillChange _: CGSize) {}

        func draw(in view: MTKView) {
            guard
                let descriptor = view.currentRenderPassDescriptor,
                let drawable = view.currentDrawable,
                let commandQueue,
                let pipelineState,
                let commandBuffer = commandQueue.makeCommandBuffer(),
                let encoder = commandBuffer.makeRenderCommandEncoder(descriptor: descriptor)
            else { return }

            var uniforms = AuthLandingUniforms(
                time: reduceMotion ? 0 : Float(CACurrentMediaTime() - startTime),
                width: Float(view.drawableSize.width),
                height: Float(view.drawableSize.height)
            )

            encoder.setRenderPipelineState(pipelineState)
            encoder.setFragmentBytes(&uniforms, length: MemoryLayout<AuthLandingUniforms>.stride, index: 0)
            encoder.drawPrimitives(type: .triangle, vertexStart: 0, vertexCount: 3)
            encoder.endEncoding()

            commandBuffer.present(drawable)
            commandBuffer.commit()
        }
    }
}

struct AuthLandingUniforms {
    var time: Float
    var width: Float
    var height: Float
}
