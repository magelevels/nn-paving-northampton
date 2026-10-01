import Foundation
import AVFoundation

// Usage: add_promo_music <supplied-music.mp3> <square.mp4> <reel.mp4>
// Fades the supplied music once, then remuxes it with the original video tracks.
// Original silent videos remain unchanged; outputs receive a -music suffix.
let args = Array(CommandLine.arguments.dropFirst())
guard args.count >= 2 else { fatalError("Provide an audio file and at least one video") }
let sourceAudioURL = URL(fileURLWithPath: args[0])
let music = AVURLAsset(url: sourceAudioURL)
guard let musicTrack = music.tracks(withMediaType: .audio).first else { fatalError("No audio track in supplied file") }

func export(_ session: AVAssetExportSession, to url: URL, type: AVFileType) throws {
    if FileManager.default.fileExists(atPath: url.path) { try FileManager.default.removeItem(at: url) }
    session.outputURL = url
    session.outputFileType = type
    session.shouldOptimizeForNetworkUse = true
    let semaphore = DispatchSemaphore(value: 0)
    session.exportAsynchronously { semaphore.signal() }
    semaphore.wait()
    guard session.status == .completed else { throw session.error ?? NSError(domain: "MusicExport", code: 1) }
}

var cachedSoundtrack: [Double: URL] = [:]
for inputPath in args.dropFirst() {
    let videoURL = URL(fileURLWithPath: inputPath)
    let video = AVURLAsset(url: videoURL)
    guard let videoTrack = video.tracks(withMediaType: .video).first else { fatalError("No video in \(inputPath)") }
    let duration = video.duration
    let seconds = CMTimeGetSeconds(duration)
    guard music.duration >= duration else { fatalError("The supplied music is shorter than the advert") }
    let soundtrackURL: URL
    if let cached = cachedSoundtrack[seconds] {
        soundtrackURL = cached
    } else {
        let soundtrack = AVMutableComposition()
        let track = soundtrack.addMutableTrack(withMediaType: .audio, preferredTrackID: kCMPersistentTrackID_Invalid)!
        try track.insertTimeRange(CMTimeRange(start: .zero, duration: duration), of: musicTrack, at: .zero)
        let parameters = AVMutableAudioMixInputParameters(track: track)
        let level: Float = 0.9
        let fadeIn = CMTime(seconds: 0.15, preferredTimescale: 44100)
        let fadeOut = CMTime(seconds: 1.15, preferredTimescale: 44100)
        parameters.setVolumeRamp(fromStartVolume: 0, toEndVolume: level, timeRange: CMTimeRange(start: .zero, duration: fadeIn))
        parameters.setVolume(level, at: fadeIn)
        parameters.setVolumeRamp(fromStartVolume: level, toEndVolume: 0, timeRange: CMTimeRange(start: duration - fadeOut, duration: fadeOut))
        let mix = AVMutableAudioMix()
        mix.inputParameters = [parameters]
        let encoder = AVAssetExportSession(asset: soundtrack, presetName: AVAssetExportPresetAppleM4A)!
        encoder.audioMix = mix
        encoder.timeRange = CMTimeRange(start: .zero, duration: duration)
        soundtrackURL = sourceAudioURL.deletingLastPathComponent().appendingPathComponent("advert-soundtrack-\(seconds)s.m4a")
        try export(encoder, to: soundtrackURL, type: .m4a)
        cachedSoundtrack[seconds] = soundtrackURL
    }
    let encodedMusic = AVURLAsset(url: soundtrackURL)
    let composition = AVMutableComposition()
    let picture = composition.addMutableTrack(withMediaType: .video, preferredTrackID: kCMPersistentTrackID_Invalid)!
    try picture.insertTimeRange(CMTimeRange(start: .zero, duration: duration), of: videoTrack, at: .zero)
    picture.preferredTransform = videoTrack.preferredTransform
    let audio = composition.addMutableTrack(withMediaType: .audio, preferredTrackID: kCMPersistentTrackID_Invalid)!
    guard let encodedTrack = encodedMusic.tracks(withMediaType: .audio).first else { fatalError("Soundtrack export failed") }
    try audio.insertTimeRange(CMTimeRange(start: .zero, duration: min(duration, encodedMusic.duration)), of: encodedTrack, at: .zero)
    let output = videoURL.deletingLastPathComponent().appendingPathComponent(videoURL.deletingPathExtension().lastPathComponent + "-music.mp4")
    let muxer = AVAssetExportSession(asset: composition, presetName: AVAssetExportPresetPassthrough)!
    muxer.timeRange = CMTimeRange(start: .zero, duration: duration)
    try export(muxer, to: output, type: .mp4)
    let finished = AVURLAsset(url: output)
    guard finished.tracks(withMediaType: .audio).count == 1,
          finished.tracks(withMediaType: .video).count == 1,
          abs(CMTimeGetSeconds(finished.duration) - seconds) < 0.05 else { fatalError("Output track or duration check failed") }
    print("Exported \(output.lastPathComponent): \(seconds)s, \(videoTrack.naturalSize), one video and one music track")
    fflush(stdout)
}
