import AppKit

let root = URL(fileURLWithPath: FileManager.default.currentDirectoryPath)
let imagesDir = root.appendingPathComponent("public/Images")
let portraitURL = imagesDir.appendingPathComponent("omar.png")
let squareOutputURL = imagesDir.appendingPathComponent("share-square.png")
let wideOutputURL = imagesDir.appendingPathComponent("og-image.png")

guard let portrait = NSImage(contentsOf: portraitURL) else {
  fputs("Failed to load portrait at \(portraitURL.path)\n", stderr)
  exit(1)
}

let white = NSColor(calibratedWhite: 0.96, alpha: 1)
let textWhite = NSColor(calibratedWhite: 0.97, alpha: 1)
let textGray = NSColor(calibratedWhite: 0.66, alpha: 1)
let border = NSColor(calibratedWhite: 1, alpha: 0.05)
let bgA = NSColor(calibratedRed: 0.09, green: 0.09, blue: 0.09, alpha: 1)
let bgB = NSColor(calibratedRed: 0.03, green: 0.03, blue: 0.03, alpha: 1)
let glowBlue = NSColor(calibratedRed: 0.04, green: 0.45, blue: 0.94, alpha: 0.18)
let glowPink = NSColor(calibratedRed: 0.87, green: 0.11, blue: 0.55, alpha: 0.14)
let glowWhite = NSColor(calibratedWhite: 1, alpha: 0.06)

func roundedRect(_ rect: CGRect, radius: CGFloat) -> NSBezierPath {
  NSBezierPath(roundedRect: rect, xRadius: radius, yRadius: radius)
}

func drawLinearBackground(in rect: CGRect) {
  let gradient = NSGradient(starting: bgA, ending: bgB)
  gradient?.draw(in: rect, angle: -35)
}

func drawGlow(center: CGPoint, radius: CGSize, color: NSColor) {
  let rect = CGRect(x: center.x - radius.width, y: center.y - radius.height, width: radius.width * 2, height: radius.height * 2)
  color.setFill()
  NSBezierPath(ovalIn: rect).fill()
}

func drawLogo(at origin: CGPoint, scale: CGFloat) {
  func x(_ value: CGFloat) -> CGFloat { origin.x + value * scale }
  func y(_ value: CGFloat) -> CGFloat { origin.y + value * scale }

  white.setFill()
  NSBezierPath(ovalIn: CGRect(x: x(0), y: y(0), width: 18 * scale, height: 18 * scale)).fill()
  NSBezierPath(rect: CGRect(x: x(21.5), y: y(0), width: 18.4286 * scale, height: 18 * scale)).fill()

  let triangle = NSBezierPath()
  triangle.move(to: CGPoint(x: x(53.75), y: y(18)))
  triangle.line(to: CGPoint(x: x(43), y: y(0)))
  triangle.line(to: CGPoint(x: x(64.5), y: y(0)))
  triangle.close()
  triangle.fill()

  let dShape = NSBezierPath()
  dShape.move(to: CGPoint(x: x(66.0357), y: y(18)))
  dShape.line(to: CGPoint(x: x(72.4643), y: y(18)))
  dShape.curve(to: CGPoint(x: x(84.4643), y: y(6)), controlPoint1: CGPoint(x: x(79.0917), y: y(18)), controlPoint2: CGPoint(x: x(84.4643), y: y(12.6274)))
  dShape.line(to: CGPoint(x: x(84.4643), y: y(0)))
  dShape.line(to: CGPoint(x: x(66.0357), y: y(0)))
  dShape.close()
  dShape.fill()
}

func drawText(_ text: String, rect: CGRect, size: CGFloat, weight: NSFont.Weight, color: NSColor, kern: CGFloat = 0, lineBreak: NSLineBreakMode = .byWordWrapping) {
  let paragraph = NSMutableParagraphStyle()
  paragraph.lineBreakMode = lineBreak
  let attrs: [NSAttributedString.Key: Any] = [
    .font: NSFont.systemFont(ofSize: size, weight: weight),
    .foregroundColor: color,
    .kern: kern,
    .paragraphStyle: paragraph,
  ]
  NSString(string: text).draw(in: rect, withAttributes: attrs)
}

func drawPortrait(in rect: CGRect) {
  let ctx = NSGraphicsContext.current?.cgContext
  ctx?.saveGState()
  ctx?.interpolationQuality = .high
  portrait.draw(in: rect, from: .zero, operation: .sourceOver, fraction: 1)
  ctx?.restoreGState()
}

func exportPNG(size: CGSize, outputURL: URL, drawing: () -> Void) {
  guard let rep = NSBitmapImageRep(
    bitmapDataPlanes: nil,
    pixelsWide: Int(size.width),
    pixelsHigh: Int(size.height),
    bitsPerSample: 8,
    samplesPerPixel: 4,
    hasAlpha: true,
    isPlanar: false,
    colorSpaceName: .deviceRGB,
    bytesPerRow: 0,
    bitsPerPixel: 0
  ) else {
    fputs("Failed to create bitmap\n", stderr)
    exit(1)
  }

  rep.size = size
  NSGraphicsContext.saveGraphicsState()
  guard let context = NSGraphicsContext(bitmapImageRep: rep) else {
    fputs("Failed to create graphics context\n", stderr)
    exit(1)
  }
  NSGraphicsContext.current = context
  drawing()
  context.flushGraphics()
  NSGraphicsContext.restoreGraphicsState()

  guard let data = rep.representation(using: .png, properties: [:]) else {
    fputs("Failed to encode PNG\n", stderr)
    exit(1)
  }

  do {
    try data.write(to: outputURL)
  } catch {
    fputs("Failed to write PNG to \(outputURL.path): \(error)\n", stderr)
    exit(1)
  }
}

func drawSquare() {
  let canvas = CGRect(x: 0, y: 0, width: 1024, height: 1024)
  drawLinearBackground(in: canvas)
  drawGlow(center: CGPoint(x: 208, y: 900), radius: CGSize(width: 178, height: 130), color: glowWhite)
  drawGlow(center: CGPoint(x: 744, y: 780), radius: CGSize(width: 194, height: 250), color: glowBlue)
  drawGlow(center: CGPoint(x: 782, y: 284), radius: CGSize(width: 270, height: 210), color: glowPink)

  border.setStroke()
  let frame = roundedRect(CGRect(x: 34, y: 34, width: 956, height: 956), radius: 34)
  frame.lineWidth = 1
  frame.stroke()

  drawPortrait(in: CGRect(x: 426, y: 86, width: 590, height: 850))
  drawLogo(at: CGPoint(x: 96, y: 892), scale: 2.18)
  drawText("Omar Tavarez", rect: CGRect(x: 88, y: 390, width: 500, height: 96), size: 78, weight: .semibold, color: textWhite, kern: -1.5, lineBreak: .byClipping)
  drawText("Product Designer", rect: CGRect(x: 94, y: 336, width: 320, height: 46), size: 30, weight: .regular, color: textGray, kern: -0.25, lineBreak: .byClipping)
}

func drawWide() {
  let canvas = CGRect(x: 0, y: 0, width: 1200, height: 630)
  drawLinearBackground(in: canvas)
  drawGlow(center: CGPoint(x: 174, y: 556), radius: CGSize(width: 176, height: 120), color: glowWhite)
  drawGlow(center: CGPoint(x: 974, y: 470), radius: CGSize(width: 214, height: 244), color: glowBlue)
  drawGlow(center: CGPoint(x: 984, y: 146), radius: CGSize(width: 270, height: 206), color: glowPink)

  border.setStroke()
  let frame = roundedRect(CGRect(x: 24, y: 24, width: 1152, height: 582), radius: 28)
  frame.lineWidth = 1
  frame.stroke()

  drawPortrait(in: CGRect(x: 726, y: 6, width: 458, height: 634))
  drawLogo(at: CGPoint(x: 86, y: 510), scale: 1.8)
  drawText("Omar Tavarez", rect: CGRect(x: 86, y: 290, width: 560, height: 94), size: 77, weight: .semibold, color: textWhite, kern: -1.5, lineBreak: .byClipping)
  drawText("Product Designer", rect: CGRect(x: 90, y: 236, width: 300, height: 42), size: 29, weight: .regular, color: textGray, kern: -0.25, lineBreak: .byClipping)
}

exportPNG(size: CGSize(width: 1024, height: 1024), outputURL: squareOutputURL, drawing: drawSquare)
exportPNG(size: CGSize(width: 1200, height: 630), outputURL: wideOutputURL, drawing: drawWide)

print("Generated \(squareOutputURL.path)")
print("Generated \(wideOutputURL.path)")
