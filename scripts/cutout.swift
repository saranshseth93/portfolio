// Removes the background from a photo using the macOS Vision foreground
// instance mask. Usage: swift scripts/cutout.swift <input.png> <output.png>
import Foundation
import Vision
import CoreImage
import AppKit

let args = CommandLine.arguments
guard args.count == 3 else { FileHandle.standardError.write("usage: cutout.swift <in> <out>\n".data(using: .utf8)!); exit(2) }
let inURL = URL(fileURLWithPath: args[1])
let outURL = URL(fileURLWithPath: args[2])
guard let ciImage = CIImage(contentsOf: inURL) else { fputs("cannot read input\n", stderr); exit(1) }

let request = VNGenerateForegroundInstanceMaskRequest()
let handler = VNImageRequestHandler(ciImage: ciImage, options: [:])
try handler.perform([request])
guard let result = request.results?.first else { fputs("no foreground found\n", stderr); exit(1) }
let maskBuffer = try result.generateMaskedImage(ofInstances: result.allInstances, from: handler, croppedToInstancesExtent: false)
let masked = CIImage(cvPixelBuffer: maskBuffer)

let ctx = CIContext()
guard let cg = ctx.createCGImage(masked, from: masked.extent) else { fputs("render failed\n", stderr); exit(1) }
let rep = NSBitmapImageRep(cgImage: cg)
guard let png = rep.representation(using: .png, properties: [:]) else { fputs("encode failed\n", stderr); exit(1) }
try png.write(to: outURL)
print("wrote \(outURL.path)")
