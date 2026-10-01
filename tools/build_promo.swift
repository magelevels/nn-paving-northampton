import Foundation
import AVFoundation
import AppKit
import CoreGraphics
import CoreMedia
import CoreVideo
import CoreText

let root = URL(fileURLWithPath: FileManager.default.currentDirectoryPath)
let assets = root.appendingPathComponent("public/assets")
let outputDir = root.deletingLastPathComponent().deletingLastPathComponent().appendingPathComponent("outputs", isDirectory: true)
try FileManager.default.createDirectory(at: outputDir, withIntermediateDirectories: true)
let output = outputDir.appendingPathComponent("nn-paving-northampton-promo.mp4")
try? FileManager.default.removeItem(at: output)

let width = 1080
let height = 1920
let fps: Int32 = 30
let sceneDuration = 4.1
let slideDuration = 0.72
let accent = NSColor(calibratedRed: 0.55, green: 0.81, blue: 0.24, alpha: 1)
let white = NSColor.white

struct Scene {
    let image: CGImage
    let label: String
    let title: [String]
    let detail: String
}

func image(_ file: String) -> CGImage {
    let url = assets.appendingPathComponent(file)
    guard let ns = NSImage(contentsOf: url), let cg = ns.cgImage(forProposedRect: nil, context: nil, hints: nil) else {
        fatalError("Missing image: \(file)")
    }
    return cg
}

let scenes = [
    Scene(image: image("driveway.jpg"), label: "DRIVEWAYS · PATIOS · LANDSCAPING", title: ["Make more of", "your outdoor space."], detail: "Paving and groundwork for homes in Northampton."),
    Scene(image: image("garden-before.jpg"), label: "A FRESH START", title: ["Ready for a", "garden refresh?"], detail: "Start with a clear plan for the space you want."),
    Scene(image: image("garden-after.jpg"), label: "THE FINISHING TOUCHES", title: ["Room to relax.", "Space to enjoy."], detail: "Paths, lawns and patios shaped around home life."),
    Scene(image: image("patio-view.jpg"), label: "PATIO & PORCELAIN PAVING", title: ["Paving that feels", "at home."], detail: "Practical outdoor spaces, planned around your home."),
    Scene(image: image("driveway.jpg"), label: "NORTHAMPTON & SURROUNDING AREAS", title: ["Let’s plan your", "next project."], detail: "Call Leon for a free, no-obligation quotation.")
]

func clamp(_ x: CGFloat, _ lo: CGFloat = 0, _ hi: CGFloat = 1) -> CGFloat { min(max(x, lo), hi) }
func ease(_ x: CGFloat) -> CGFloat { let t = clamp(x); return t * t * (3 - 2 * t) }

func drawImage(_ image: CGImage, context: CGContext, zoom: CGFloat, horizontalDrift: CGFloat) {
    let iw = CGFloat(image.width)
    let ih = CGFloat(image.height)
    let scale = max(CGFloat(width) / iw, CGFloat(height) / ih) * zoom
    let dw = iw * scale
    let dh = ih * scale
    let x = (CGFloat(width) - dw) * 0.5 + horizontalDrift
    let y = (CGFloat(height) - dh) * 0.5
    context.interpolationQuality = .high
    context.draw(image, in: CGRect(x: x, y: y, width: dw, height: dh))
}

func roundedRect(_ context: CGContext, _ rect: CGRect, radius: CGFloat, color: NSColor) {
    context.setFillColor(color.cgColor)
    context.addPath(CGPath(roundedRect: rect, cornerWidth: radius, cornerHeight: radius, transform: nil))
    context.fillPath()
}

func textWidth(_ text: String, font: CTFont) -> CGFloat {
    let attributed = CFAttributedStringCreate(nil, text as CFString, [kCTFontAttributeName: font] as CFDictionary)!
    let line = CTLineCreateWithAttributedString(attributed)
    return CGFloat(CTLineGetTypographicBounds(line, nil, nil, nil))
}

func drawText(_ text: String, x: CGFloat, baseline: CGFloat, size: CGFloat, color: NSColor, weight: NSFont.Weight = .regular, maxWidth: CGFloat? = nil, context: CGContext) {
    var finalSize = size
    let fontName: CFString = weight >= .semibold ? "AvenirNext-DemiBold" as CFString : "AvenirNext-Medium" as CFString
    var font = CTFontCreateWithName(fontName, finalSize, nil)
    if let maxWidth {
        while textWidth(text, font: font) > maxWidth && finalSize > 15 {
            finalSize -= 1
            font = CTFontCreateWithName(fontName, finalSize, nil)
        }
    }
    let attributed = CFAttributedStringCreate(nil, text as CFString, [kCTFontAttributeName: font, kCTForegroundColorAttributeName: color.cgColor] as CFDictionary)!
    let line = CTLineCreateWithAttributedString(attributed)
    context.saveGState()
    context.textPosition = CGPoint(x: x, y: baseline)
    CTLineDraw(line, context)
    context.restoreGState()
}

func drawImageAndCopy(_ index: Int, timeInScene: Double, shift: CGFloat, context: CGContext) {
    let scene = scenes[index]
    let progress = clamp(CGFloat(timeInScene / sceneDuration))
    let zoom = 1.035 + 0.026 * ease(progress)
    let drift = (index % 2 == 0 ? -1 : 1) * 20 * ease(progress)
    context.saveGState()
    context.translateBy(x: shift, y: 0)
    drawImage(scene.image, context: context, zoom: zoom, horizontalDrift: drift)

    // Darken the photo just enough for legible on-screen copy.
    context.setFillColor(NSColor(calibratedWhite: 0, alpha: 0.17).cgColor)
    context.fill(CGRect(x: 0, y: 0, width: width, height: height))
    let colors = [NSColor.clear.cgColor, NSColor(calibratedWhite: 0.015, alpha: 0.92).cgColor] as CFArray
    let gradient = CGGradient(colorsSpace: CGColorSpaceCreateDeviceRGB(), colors: colors, locations: [0.18, 0.92])!
    context.drawLinearGradient(gradient, start: CGPoint(x: 0, y: 1000), end: CGPoint(x: 0, y: 0), options: [])

    // Compact brand lockup.
    roundedRect(context, CGRect(x: 66, y: 1740, width: 18, height: 66), radius: 8, color: accent)
    drawText("NN PAVING", x: 108, baseline: 1785, size: 34, color: white, weight: .bold, context: context)
    drawText("NORTHAMPTON", x: 109, baseline: 1753, size: 17, color: accent, weight: .semibold, context: context)

    // Story label and headline enter with a small horizontal move.
    let reveal = ease(clamp(CGFloat(timeInScene / 0.62)))
    let textOffset = (1 - reveal) * 48
    roundedRect(context, CGRect(x: 66 + textOffset, y: 1010, width: min(770, max(385, CGFloat(scene.label.count) * 18 + 64)), height: 54), radius: 27, color: accent)
    drawText(scene.label, x: 94 + textOffset, baseline: 1028, size: 19, color: NSColor.black, weight: .bold, maxWidth: 720, context: context)
    let titleSize: CGFloat = 82
    let firstBaseline: CGFloat = scene.title.count > 1 ? 880 : 825
    for (lineIndex, line) in scene.title.enumerated() {
        drawText(line, x: 66 + textOffset, baseline: firstBaseline - CGFloat(lineIndex) * 98, size: titleSize, color: white, weight: .bold, maxWidth: 940, context: context)
    }
    drawText(scene.detail, x: 70 + textOffset, baseline: 620, size: 28, color: NSColor(calibratedWhite: 0.92, alpha: 1), weight: .medium, maxWidth: 920, context: context)

    // Strong call to action stays in the same place throughout the advert.
    roundedRect(context, CGRect(x: 66, y: 390, width: 710, height: 92), radius: 46, color: accent)
    drawText("CALL LEON   07999 749569", x: 105, baseline: 423, size: 31, color: NSColor.black, weight: .bold, maxWidth: 635, context: context)
    drawText("Free, no-obligation quote · Ask about your project", x: 70, baseline: 330, size: 22, color: NSColor(calibratedWhite: 0.92, alpha: 1), weight: .medium, maxWidth: 900, context: context)

    // Social destinations and the current live site remain visible at the end of each scene.
    drawText("@nnpavingnorthampton   ·   Facebook: NN Paving Northampton", x: 68, baseline: 184, size: 19, color: NSColor(calibratedWhite: 0.92, alpha: 1), weight: .medium, maxWidth: 945, context: context)
    drawText("nn-paving-northampton.taylorrbyt.chatgpt.site", x: 68, baseline: 132, size: 20, color: accent, weight: .semibold, maxWidth: 945, context: context)
    context.restoreGState()
}

func renderFrame(at time: Double, pixelBuffer: CVPixelBuffer) {
    CVPixelBufferLockBaseAddress(pixelBuffer, [])
    defer { CVPixelBufferUnlockBaseAddress(pixelBuffer, []) }
    guard let base = CVPixelBufferGetBaseAddress(pixelBuffer),
          let context = CGContext(data: base, width: width, height: height, bitsPerComponent: 8, bytesPerRow: CVPixelBufferGetBytesPerRow(pixelBuffer), space: CGColorSpaceCreateDeviceRGB(), bitmapInfo: CGImageAlphaInfo.premultipliedFirst.rawValue | CGBitmapInfo.byteOrder32Little.rawValue) else { return }
    context.setFillColor(NSColor(calibratedWhite: 0.025, alpha: 1).cgColor)
    context.fill(CGRect(x: 0, y: 0, width: width, height: height))

    let index = min(scenes.count - 1, Int(time / sceneDuration))
    let local = time - Double(index) * sceneDuration
    let inSlide = local < slideDuration && index > 0
    let outSlide = local >= sceneDuration - slideDuration && index < scenes.count - 1

    if inSlide {
        let p = ease(CGFloat(local / slideDuration))
        context.saveGState()
        context.clip(to: CGRect(x: 0, y: 0, width: CGFloat(width) * (1 - p), height: CGFloat(height)))
        drawImageAndCopy(index - 1, timeInScene: sceneDuration - slideDuration + local, shift: -CGFloat(width) * p, context: context)
        context.restoreGState()
        context.saveGState()
        context.clip(to: CGRect(x: CGFloat(width) * (1 - p), y: 0, width: CGFloat(width) * p, height: CGFloat(height)))
        drawImageAndCopy(index, timeInScene: local, shift: CGFloat(width) * (1 - p), context: context)
        context.restoreGState()
    } else if outSlide {
        let p = ease(CGFloat((local - (sceneDuration - slideDuration)) / slideDuration))
        context.saveGState()
        context.clip(to: CGRect(x: 0, y: 0, width: CGFloat(width) * (1 - p), height: CGFloat(height)))
        drawImageAndCopy(index, timeInScene: local, shift: -CGFloat(width) * p, context: context)
        context.restoreGState()
        context.saveGState()
        context.clip(to: CGRect(x: CGFloat(width) * (1 - p), y: 0, width: CGFloat(width) * p, height: CGFloat(height)))
        drawImageAndCopy(index + 1, timeInScene: slideDuration * p, shift: CGFloat(width) * (1 - p), context: context)
        context.restoreGState()
    } else {
        drawImageAndCopy(index, timeInScene: local, shift: 0, context: context)
    }

    // Slim progress line signals a deliberate, edited sequence.
    let total = Double(scenes.count) * sceneDuration
    let progress = CGFloat(time / total)
    context.setFillColor(NSColor.white.withAlphaComponent(0.32).cgColor)
    context.fill(CGRect(x: 66, y: 1850, width: 948, height: 5))
    context.setFillColor(accent.cgColor)
    context.fill(CGRect(x: 66, y: 1850, width: 948 * progress, height: 5))
}

let writer = try AVAssetWriter(outputURL: output, fileType: .mp4)
let settings: [String: Any] = [
    AVVideoCodecKey: AVVideoCodecType.h264,
    AVVideoWidthKey: width,
    AVVideoHeightKey: height,
    AVVideoCompressionPropertiesKey: [
        AVVideoAverageBitRateKey: 7_000_000,
        AVVideoProfileLevelKey: AVVideoProfileLevelH264HighAutoLevel,
        AVVideoExpectedSourceFrameRateKey: 30
    ]
]
let input = AVAssetWriterInput(mediaType: .video, outputSettings: settings)
input.expectsMediaDataInRealTime = false
let adaptor = AVAssetWriterInputPixelBufferAdaptor(assetWriterInput: input, sourcePixelBufferAttributes: [
    kCVPixelBufferPixelFormatTypeKey as String: Int(kCVPixelFormatType_32BGRA),
    kCVPixelBufferWidthKey as String: width,
    kCVPixelBufferHeightKey as String: height
])
writer.add(input)
writer.startWriting()
writer.startSession(atSourceTime: .zero)
let totalFrames = Int(Double(scenes.count) * sceneDuration * Double(fps))
for frame in 0..<totalFrames {
    while !input.isReadyForMoreMediaData { Thread.sleep(forTimeInterval: 0.002) }
    var buffer: CVPixelBuffer?
    let attrs: [String: Any] = [
        kCVPixelBufferCGImageCompatibilityKey as String: true,
        kCVPixelBufferCGBitmapContextCompatibilityKey as String: true,
        kCVPixelBufferWidthKey as String: width,
        kCVPixelBufferHeightKey as String: height,
        kCVPixelBufferPixelFormatTypeKey as String: Int(kCVPixelFormatType_32BGRA)
    ]
    CVPixelBufferCreate(kCFAllocatorDefault, width, height, kCVPixelFormatType_32BGRA, attrs as CFDictionary, &buffer)
    guard let buffer else { continue }
    let seconds = Double(frame) / Double(fps)
    renderFrame(at: seconds, pixelBuffer: buffer)
    let presentationTime = CMTime(value: CMTimeValue(frame), timescale: fps)
    adaptor.append(buffer, withPresentationTime: presentationTime)
}
input.markAsFinished()
let completed = DispatchSemaphore(value: 0)
writer.finishWriting { completed.signal() }
completed.wait()
guard writer.status == .completed else {
    fatalError("MP4 export failed: \(writer.error?.localizedDescription ?? "unknown error")")
}
print("Created silent sliding advert: \(output.path)")
