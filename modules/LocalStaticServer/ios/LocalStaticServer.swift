import Foundation
import React

@objc(LocalStaticServer)
class LocalStaticServer: NSObject {
  private let queue = DispatchQueue(label: "com.classlocator.localstaticserver")
  private var server: TinyHTTPServer?

  @objc static func requiresMainQueueSetup() -> Bool {
    false
  }

  @objc func start(
    _ rootPath: String,
    port: NSNumber,
    localOnly: Bool,
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    queue.async { [weak self] in
      guard let self = self else { return }
      self.server?.stop()
      self.server = nil
      do {
        let srv = TinyHTTPServer(rootPath: rootPath, localOnly: localOnly)
        let p = try srv.start(port: port.intValue)
        self.server = srv
        let host = localOnly ? "localhost" : "0.0.0.0"
        resolve("http://\(host):\(p)")
      } catch {
        reject("E_START_FAILED", error.localizedDescription, error)
      }
    }
  }

  @objc func stop(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    queue.async { [weak self] in
      self?.server?.stop()
      self?.server = nil
      resolve(nil)
    }
  }
}
