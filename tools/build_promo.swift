import Foundation
import AVFoundation
import AppKit
import CoreGraphics
import CoreText
import CoreVideo
import CoreImage

let root = URL(fileURLWithPath:FileManager.default.currentDirectoryPath)
let assetDir = root.appendingPathComponent("public/assets")
let outDir = root.deletingLastPathComponent().deletingLastPathComponent().appendingPathComponent("outputs")
let workDir = root.deletingLastPathComponent().appendingPathComponent("advert-v3")
let vertical = CommandLine.arguments.contains("--vertical")
let preview = CommandLine.arguments.contains("--preview")
let W: CGFloat = 1080
let H: CGFloat = vertical ? 1920 : 1080
let green = NSColor(calibratedRed:0.56,green:0.80,blue:0.23,alpha:1).cgColor
let black = NSColor(calibratedWhite:0.025,alpha:1).cgColor
let white = NSColor.white.cgColor
let gray = NSColor(calibratedWhite:0.7,alpha:1).cgColor
let starts: [Double] = [0,3.2,6.0,8.8,12.4,14.3,17.7]
let ends: [Double] = [3.2,6.0,8.8,12.4,14.3,17.7,22.4]
let duration = ends.last!
let fps: Int32 = 30
let colorSpace = CGColorSpaceCreateDeviceRGB()
let ciContext = CIContext(options:[.cacheIntermediates:false])

func clamp(_ v: Double) -> CGFloat { CGFloat(min(1,max(0,v))) }
func ease(_ p: CGFloat) -> CGFloat { let p=min(1,max(0,p)); return p*p*(3-2*p) }
func out(_ p: CGFloat) -> CGFloat { let p=min(1,max(0,p)); return 1-pow(1-p,3) }
func R(_ x:CGFloat,_ y:CGFloat,_ w:CGFloat,_ h:CGFloat)->CGRect { CGRect(x:x,y:H-y-h,width:w,height:h) }
func context()->CGContext { CGContext(data:nil,width:Int(W),height:Int(H),bitsPerComponent:8,bytesPerRow:0,space:colorSpace,bitmapInfo:CGImageAlphaInfo.premultipliedLast.rawValue)! }
func fill(_ c:CGContext,_ rect:CGRect,_ color:CGColor) { c.setFillColor(color);c.fill(rect) }
func rounded(_ c:CGContext,_ rect:CGRect,_ radius:CGFloat,_ color:CGColor) { c.setFillColor(color);c.addPath(CGPath(roundedRect:rect,cornerWidth:radius,cornerHeight:radius,transform:nil));c.fillPath() }
func transform(_ c:CGContext, cx:CGFloat,cy:CGFloat,angle:CGFloat=0,scale:CGFloat=1,_ body:()->Void) {
 c.saveGState();c.translateBy(x:cx,y:H-cy);c.rotate(by:-angle * .pi/180);c.scaleBy(x:scale,y:scale);c.translateBy(x:-cx,y:-(H-cy));body();c.restoreGState()
}
func load(_ name:String,crop:Bool=false)->CGImage {
 let ns=NSImage(contentsOf:assetDir.appendingPathComponent(name))!
 var cg=ns.cgImage(forProposedRect:nil,context:nil,hints:nil)!
 if crop { cg=cg.cropping(to:CGRect(x:CGFloat(cg.width)*0.102,y:0,width:CGFloat(cg.width)*0.79,height:CGFloat(cg.height)))! }
 return cg
}
let driveway=load("driveway.jpg")
let patio=load("patio-view.jpg",crop:true)
let before=load("garden-before.jpg",crop:true)
let after=load("garden-after.jpg",crop:true)
let edging=load("a140e18f487abc54.jpg",crop:true)
let lawn=load("de44c02e67bd8f07.jpg",crop:true)
let logo=load("71e409f3ab698107.jpg")
let montage=[driveway,patio,after]

func photo(_ c:CGContext,_ img:CGImage,_ rect:CGRect,zoom:CGFloat=1,fx:CGFloat=0.5,fy:CGFloat=0.5,alpha:CGFloat=1) {
 c.saveGState();c.clip(to:rect);c.setAlpha(alpha)
 let scale=max(rect.width/CGFloat(img.width),rect.height/CGFloat(img.height))*zoom
 let iw=CGFloat(img.width)*scale,ih=CGFloat(img.height)*scale
 c.interpolationQuality = .high
 c.draw(img,in:CGRect(x:rect.minX+(rect.width-iw)*fx,y:rect.minY+(rect.height-ih)*fy,width:iw,height:ih))
 c.restoreGState()
}
func line(_ c:CGContext,_ str:String,x:CGFloat,y:CGFloat,size:CGFloat,color:CGColor=NSColor.white.cgColor,center:Bool=false,italic:Bool=true,max:CGFloat=960,font:String="Arial-Black") {
 var size=size
 func make(_ s:CGFloat)->CTLine {
  let f=CTFontCreateWithName(font as CFString,s,nil)
  let attributes=[kCTFontAttributeName:f,kCTForegroundColorAttributeName:color] as CFDictionary
  return CTLineCreateWithAttributedString(CFAttributedStringCreate(nil,str as CFString,attributes)!)
 }
 var text=make(size);var a:CGFloat=0;var d:CGFloat=0
 var width=CGFloat(CTLineGetTypographicBounds(text,&a,&d,nil))
 while width+(italic ? size*0.18:0)>max && size>12 { size-=1;text=make(size);width=CGFloat(CTLineGetTypographicBounds(text,&a,&d,nil)) }
 c.saveGState();c.translateBy(x:center ? x-width/2:x,y:H-y-a)
 if italic { c.concatenate(CGAffineTransform(a:1,b:0,c:0.16,d:1,tx:0,ty:0)) }
 c.textPosition = .zero; CTLineDraw(text,c);c.restoreGState()
}
func sticker(_ c:CGContext,_ strings:[String],cx:CGFloat,top:CGFloat,width:CGFloat,size:CGFloat,angle:CGFloat=0,color:CGColor=NSColor.white.cgColor,textColor:CGColor=NSColor.black.cgColor,scale:CGFloat=1) {
 let height=CGFloat(strings.count)*size*1.08+38
 transform(c,cx:cx,cy:top+height/2,angle:angle,scale:scale) {
  c.saveGState();c.setShadow(offset:CGSize(width:0,height:-12),blur:22,color:NSColor.black.withAlphaComponent(0.28).cgColor)
  rounded(c,R(cx-width/2,top,width,height),18,color);c.restoreGState()
  for (i,str) in strings.enumerated() {line(c,str,x:cx,y:top+16+CGFloat(i)*size*1.08,size:size,color:textColor,center:true,max:width-65)}
 }
}
func shade(_ c:CGContext,top:CGFloat=0,bottom:CGFloat=0.84) {
 let g=CGGradient(colorsSpace:colorSpace,colors:[NSColor.black.withAlphaComponent(top).cgColor,NSColor.black.withAlphaComponent(bottom).cgColor] as CFArray,locations:[0,1])!
 c.drawLinearGradient(g,start:CGPoint(x:0,y:H*0.65),end:CGPoint(x:0,y:0),options:[.drawsAfterEndLocation,.drawsBeforeStartLocation])
}
func brand(_ c:CGContext,dark:Bool=false) {
 let col=dark ? black:white
 line(c,"NN PAVING",x:60,y:vertical ? 110:45,size:27,color:col,italic:false,max:400)
 fill(c,R(60,vertical ? 151:86,45,5),green)
 line(c,"NORTHAMPTON",x:W-60,y:vertical ? 120:52,size:18,color:col,center:false,italic:false,max:220,font:"Arial-BoldMT")
}
// A small right-aligned location label, used instead of clipping the full word at the frame edge.
func location(_ c:CGContext,color:CGColor=NSColor.white.cgColor) { line(c,"NORTHAMPTON",x:785,y:vertical ? 120:52,size:18,color:color,italic:false,max:235,font:"Arial-BoldMT") }
func header(_ c:CGContext,dark:Bool=false) {
 line(c,"NN PAVING",x:60,y:vertical ? 110:45,size:27,color:dark ? black:white,italic:false,max:400)
 fill(c,R(60,vertical ? 151:86,45,5),green);location(c,color:dark ? black:white)
}
func outlinedFrame(_ c:CGContext,centerY:CGFloat,width:CGFloat,height:CGFloat,angle:CGFloat,color:CGColor,thickness:CGFloat=3) {
 transform(c,cx:W/2,cy:centerY,angle:angle) {c.setStrokeColor(color);c.setLineWidth(thickness);c.stroke(R((W-width)/2,centerY-height/2,width,height))}
}

func scene(_ idx:Int,_ time:Double)->CGImage {
 let c=context();fill(c,R(0,0,W,H),black)
 let p=clamp(time/(ends[idx]-starts[idx]));let enter=out(clamp(time/0.7))
 switch idx {
 case 0:
  // Three real-project cards slide into a layered composition.
  let ch:CGFloat=vertical ? 1160:870
  let cy:CGFloat=vertical ? H*0.48:H*0.51
  let gap:CGFloat=340
  let move=(1-enter)*520
  for i in [0,2,1] {
   let cx=W/2+CGFloat(i-1)*gap+(i==0 ? -move:move)*(i==1 ? 0.3:1)
   let cw:CGFloat=i==1 ? 555:430
   let angle:CGFloat=i==0 ? -11:(i==2 ? 11:-3)
   transform(c,cx:cx,cy:cy,angle:angle,scale:i==1 ? 0.94+0.06*enter:0.96) {
    let frame=R(cx-cw/2,cy-ch/2,cw,ch)
    c.saveGState();c.setShadow(offset:CGSize(width:0,height:-20),blur:45,color:NSColor.black.withAlphaComponent(0.7).cgColor);fill(c,frame.insetBy(dx:-8,dy:-8),white);c.restoreGState()
    photo(c,montage[i],frame,zoom:1.025+0.04*p,fy:0.4)
   }
  }
  shade(c,top:0,bottom:0.5)
  sticker(c,["LOOKING TO UPGRADE","YOUR OUTDOOR SPACE?"],cx:W/2,top:vertical ? 265:155,width:915,size:48,angle:-3,scale:0.90+0.10*enter)
  sticker(c,["LET’S MAKE IT HAPPEN."],cx:W/2,top:vertical ? 1510:865,width:785,size:43,angle:2,color:green,scale:0.93+0.07*out(clamp((time-0.4)/0.6)))
  if vertical {line(c,"Driveways • patios • landscaping",x:W/2,y:1700,size:29,color:white,center:true,italic:false,font:"Arial-BoldMT")}
 case 1:
  photo(c,driveway,R(0,0,W,H),zoom:1.035+0.055*p,fy:0.42)
  shade(c,top:0.03,bottom:0.75);header(c)
  let yy:CGFloat=vertical ? 1280:725
  let offset=(1-out(clamp((time-0.25)/0.55)))*200
  line(c,"DRIVEWAYS",x:60+offset,y:yy,size:vertical ? 114:111,color:white,max:940)
  fill(c,R(68,yy+143,150+640*enter,10),green)
  line(c,"BLOCK PAVING & GROUNDWORK",x:68,y:yy+190,size:32,color:green,italic:false,max:960,font:"Arial-BoldMT")
 case 2:
  // Framed patio photo with a moving detail strip.
  photo(c,patio,R(0,0,W,H),zoom:1.04+0.04*p,fy:0.30);shade(c,top:0.06,bottom:0.80);header(c)
  let detailY:CGFloat=vertical ? 900:455
  let detailH:CGFloat=vertical ? 300:200
  transform(c,cx:W*0.74,cy:detailY+detailH/2,angle:5-2*p) {
   let rr=R(660+(1-enter)*450,detailY,340,detailH)
   fill(c,rr.insetBy(dx:-7,dy:-7),white);photo(c,edging,rr,zoom:1.04)
  }
  let yy:CGFloat=vertical ? 1280:718
  line(c,"PATIOS",x:64+(1-enter)*160,y:yy,size:128,color:white,max:930)
  line(c,"PORCELAIN PAVING",x:68,y:yy+171,size:35,color:green,italic:false,max:900,font:"Arial-BoldMT")
 case 3:
  // Authentic before/after project reveal.
  let reveal=ease(clamp((time-1.15)/0.76))
  photo(c,before,R(0,0,W,H),zoom:1.02+0.02*p,fy:0.4)
  if reveal>0 {
   c.saveGState();c.clip(to:R(W*(1-reveal),0,W*reveal,H));photo(c,after,R(0,0,W,H),zoom:1.045,fy:0.33);c.restoreGState()
   if reveal<1 {fill(c,R(W*(1-reveal)-5,0,10,H),green)}
  }
  shade(c,top:0.10,bottom:0.72);header(c)
  let afterShown=reveal>0.5
  sticker(c,[afterShown ? "AFTER":"BEFORE"],cx:W-172,top:vertical ? 270:145,width:216,size:30,angle:afterShown ? 4:-4,color:afterShown ? green:white)
  let yy:CGFloat=vertical ? 1270:725
  line(c,afterShown ? "A WHOLE NEW":"A FRESH",x:60,y:yy,size:88,color:white,max:940)
  line(c,afterShown ? "FEEL.":"START.",x:60,y:yy+104,size:108,color:afterShown ? green:white,max:940)
  if vertical {line(c,"Landscaping • lawns • pathways",x:62,y:1580,size:31,color:white,italic:false,max:920,font:"Arial-BoldMT")}
 case 4:
  let seam:CGFloat=14
  let centerY:CGFloat=vertical ? 910:540
  photo(c,edging,R(0,0,W*0.50-seam/2,H),zoom:1.06+0.03*p,fy:0.25)
  photo(c,lawn,R(W*0.50+seam/2,0,W*0.50-seam/2,H),zoom:1.02+0.06*p,fy:0.3)
  sticker(c,["THE DETAILS MAKE","THE DIFFERENCE."],cx:W/2,top:centerY-110,width:940,size:55,angle:-4,scale:0.84+0.16*enter)
  if vertical {sticker(c,["PAVING • LAWNS • PATHS"],cx:W/2,top:1530,width:830,size:35,angle:3,color:green)}
 case 5:
  // The rotating geometric quote card echoes the reference's commercial-ad rhythm.
  fill(c,R(0,0,W,H),black)
  let ch:CGFloat=vertical ? 1360:948
  let cy:CGFloat=H/2
  transform(c,cx:W/2,cy:cy,angle:15*(1-enter)-1.5,scale:0.72+0.28*enter) {
   rounded(c,R(53,cy-ch/2,W-106,ch),10,white)
   outlinedFrame(c,centerY:cy,width:735,height:ch-175,angle:-7+12*p,color:black,thickness:2)
   outlinedFrame(c,centerY:cy,width:710,height:ch-165,angle:18-17*p,color:green,thickness:4)
   let mainY:CGFloat=vertical ? 690:310
   fill(c,R(177,mainY-45,725,300),white)
   line(c,"FREE QUOTE.",x:W/2,y:mainY,size:87,color:black,center:true,max:860)
   line(c,"NO OBLIGATION.",x:W/2,y:mainY+102,size:66,color:black,center:true,max:865)
   sticker(c,["LET’S TALK ABOUT YOUR SPACE."],cx:W/2,top:mainY+248,width:773,size:29,color:green)
   let logoS:CGFloat=vertical ? 315:230
   c.draw(logo,in:R((W-logoS)/2,cy+ch/2-logoS-84,logoS,logoS))
  }
 case 6:
  // Clean logo finish; the phone stays readable for more than four seconds.
  fill(c,R(0,0,W,H),black)
  // Oversized type in the background supplies movement without covering the real logo.
  c.saveGState();c.setAlpha(0.10)
  line(c,"NN",x:-100+60*p,y:vertical ? 630:230,size:640,color:white,italic:true,max:1500)
  c.restoreGState()
  let logoS:CGFloat=vertical ? 590:442
  let logoY:CGFloat=vertical ? 595:300
  let move=(1-out(clamp(time/0.6)))*400
  transform(c,cx:W/2,cy:logoY+logoS/2,angle:6*(1-enter),scale:0.75+0.25*enter) {
   let rr=R((W-logoS)/2,logoY+move,logoS,logoS)
   rounded(c,rr.insetBy(dx:-18,dy:-18),26,white)
   c.draw(logo,in:rr)
  }
  let headY:CGFloat=vertical ? 240:74
  transform(c,cx:W*0.34,cy:headY+84,angle:-8) {
   line(c,"CALL LEON",x:95,y:headY,size:74,color:white,max:835)
   line(c,"TODAY!",x:104,y:headY+85,size:83,color:green,max:830)
  }
  let numberY:CGFloat=vertical ? 1330:825
  let numberEnter=out(clamp((time-0.35)/0.5))
  line(c,"07999 749569",x:W/2+(1-numberEnter)*150,y:numberY,size:vertical ? 105:95,color:white,center:true,max:940)
  line(c,"FREE, NO-OBLIGATION QUOTATIONS",x:W/2,y:numberY+130,size:vertical ? 30:24,color:green,center:true,italic:false,max:920,font:"Arial-BoldMT")
  let socialY:CGFloat=vertical ? 1610:1004
  line(c,"@nnpavingnorthampton",x:W/2,y:socialY,size:vertical ? 31:22,color:white,center:true,italic:false,max:900,font:"Arial-BoldMT")
  if vertical {
   line(c,"Northampton & surrounding areas",x:W/2,y:1670,size:26,color:gray,center:true,italic:false,max:950,font:"ArialMT")
   line(c,"nn-paving-northampton.taylorrbyt.chatgpt.site",x:W/2,y:1730,size:23,color:gray,center:true,italic:false,max:950,font:"ArialMT")
  }
 default:break
 }
 return c.makeImage()!
}

// Each scene change is animated exactly once, at the start of the incoming scene.
var endCards: [Int:CGImage]=[:]
func composite(_ t:Double)->CGImage {
 let idx=starts.lastIndex(where:{$0<=t}) ?? 0
 let local=t-starts[idx]
 let incoming=scene(idx,local)
 let transition=idx==5 ? 0.65:0.50
 if idx==0 || local>=transition {return incoming}
 let prev:CGImage
 if let cached=endCards[idx-1] {prev=cached} else {prev=scene(idx-1,ends[idx-1]-starts[idx-1]-0.01);endCards[idx-1]=prev}
 let p=ease(clamp(local/transition))
 let c=context();fill(c,R(0,0,W,H),black)
 let full=R(0,0,W,H)
 if idx==1 || idx==3 || idx==6 {
  // Alternating horizontal strips pull apart like the reference's split-screen slides.
  c.draw(incoming,in:full)
  let n=idx==3 ? 3:2
  for strip in 0..<n {
   let yy=H*CGFloat(strip)/CGFloat(n),hh=H/CGFloat(n)+1
   c.saveGState();c.clip(to:R(0,yy,W,hh))
   let sign:CGFloat=strip%2==0 ? -1:1
   c.translateBy(x:sign*W*p,y:0);c.draw(prev,in:full);c.restoreGState()
  }
 } else if idx==2 || idx==4 {
  c.draw(incoming,in:full)
  // A quick diagonal photo-card throw.
  transform(c,cx:W/2,cy:H/2,angle:-11*p,scale:1-0.15*p) {
   c.translateBy(x:-W*1.4*p,y:H*0.1*p);c.draw(prev,in:full)
  }
 } else {
  c.draw(prev,in:full)
  transform(c,cx:W/2,cy:H/2,angle:16*(1-p),scale:0.20+0.80*p) {c.setAlpha(min(1,p*1.8));c.draw(incoming,in:full)}
 }
 let image=c.makeImage()!
 // Short directional blur makes the rapid movement feel like an edit, not a slideshow.
 let amount=sin(Double(p)*Double.pi)*9
 if amount>0.5, let filter=CIFilter(name:"CIMotionBlur") {
  filter.setValue(CIImage(cgImage:image),forKey:kCIInputImageKey);filter.setValue(amount,forKey:kCIInputRadiusKey);filter.setValue(0,forKey:kCIInputAngleKey)
  if let processed=filter.outputImage,let cg=ciContext.createCGImage(processed,from:full) {return cg}
 }
 return image
}

try FileManager.default.createDirectory(at:outDir,withIntermediateDirectories:true)
try FileManager.default.createDirectory(at:workDir.appendingPathComponent("previews"),withIntermediateDirectories:true)
let tag=vertical ? "reel":"square"
if preview {
 for sec in [1.1,3.43,4.1,6.23,7.0,9.6,10.8,13.1,15.5,19.8] {
  let cg=composite(sec)
  let rep=NSBitmapImageRep(cgImage:cg)
  try rep.representation(using:.jpeg,properties:[.compressionFactor:0.90])!.write(to:workDir.appendingPathComponent("previews/\(tag)-\(sec).jpg"))
 }
 print("Preview frames written")
 exit(0)
}
let filename="nn-paving-advert-\(tag).mp4"
let output=outDir.appendingPathComponent(filename)
if FileManager.default.fileExists(atPath:output.path) {try FileManager.default.removeItem(at:output)}
let writer=try AVAssetWriter(outputURL:output,fileType:.mp4)
writer.shouldOptimizeForNetworkUse=true
let input=AVAssetWriterInput(mediaType:.video,outputSettings:[AVVideoCodecKey:AVVideoCodecType.h264,AVVideoWidthKey:Int(W),AVVideoHeightKey:Int(H),AVVideoCompressionPropertiesKey:[AVVideoAverageBitRateKey:vertical ? 10_000_000:8_000_000,AVVideoExpectedSourceFrameRateKey:30,AVVideoMaxKeyFrameIntervalKey:60,AVVideoProfileLevelKey:AVVideoProfileLevelH264HighAutoLevel]])
input.expectsMediaDataInRealTime=false
let adaptor=AVAssetWriterInputPixelBufferAdaptor(assetWriterInput:input,sourcePixelBufferAttributes:[kCVPixelBufferPixelFormatTypeKey as String:Int(kCVPixelFormatType_32BGRA),kCVPixelBufferWidthKey as String:Int(W),kCVPixelBufferHeightKey as String:Int(H),kCVPixelBufferCGImageCompatibilityKey as String:true,kCVPixelBufferCGBitmapContextCompatibilityKey as String:true])
writer.add(input)
guard writer.startWriting() else {fatalError("Cannot start writer: \(String(describing:writer.error))")}
writer.startSession(atSourceTime:.zero)
for frame in 0..<Int(duration*Double(fps)) {
 while !input.isReadyForMoreMediaData {Thread.sleep(forTimeInterval:0.003)}
 autoreleasepool {
  let cg=composite(Double(frame)/Double(fps))
  var buffer:CVPixelBuffer?
  CVPixelBufferPoolCreatePixelBuffer(nil,adaptor.pixelBufferPool!,&buffer)
  guard let buffer else {fatalError("Cannot allocate frame")}
  CVPixelBufferLockBaseAddress(buffer,[])
  let c=CGContext(data:CVPixelBufferGetBaseAddress(buffer),width:Int(W),height:Int(H),bitsPerComponent:8,bytesPerRow:CVPixelBufferGetBytesPerRow(buffer),space:colorSpace,bitmapInfo:CGImageAlphaInfo.premultipliedFirst.rawValue|CGBitmapInfo.byteOrder32Little.rawValue)!
  c.draw(cg,in:R(0,0,W,H))
  CVPixelBufferUnlockBaseAddress(buffer,[])
  if !adaptor.append(buffer,withPresentationTime:CMTime(value:CMTimeValue(frame),timescale:fps)) {fatalError("Frame write failed: \(String(describing:writer.error))")}
 }
 if frame%150==0 {print("\(tag): \(frame)/\(Int(duration*Double(fps))) frames");fflush(stdout)}
}
input.markAsFinished()
let sem=DispatchSemaphore(value:0)
writer.finishWriting{sem.signal()};sem.wait()
guard writer.status == .completed else {fatalError("Export failed: \(String(describing:writer.error))")}
print("Created \(output.path)")
