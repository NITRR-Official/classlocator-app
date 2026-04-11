import Darwin
import Foundation

/// Minimal loopback/static HTTP/1.1 file server (GET only).
final class TinyHTTPServer {
  private let rootURL: URL
  private let localOnly: Bool
  private var listenFD: Int32 = -1
  private var acceptThread: Thread?
  private var running = false
  private let stateLock = NSLock()

  init(rootPath: String, localOnly: Bool) {
    self.rootURL = URL(fileURLWithPath: rootPath, isDirectory: true)
    self.localOnly = localOnly
  }

  func start(port requested: Int) throws -> Int {
    stop()
    let fd = socket(AF_INET, SOCK_STREAM, 0)
    guard fd >= 0 else {
      throw NSError(domain: "TinyHTTPServer", code: 1, userInfo: [NSLocalizedDescriptionKey: "socket() failed"])
    }
    var yes: Int32 = 1
    setsockopt(fd, SOL_SOCKET, SO_REUSEADDR, &yes, socklen_t(MemoryLayout<Int32>.size))

    var addr = sockaddr_in()
    addr.sin_len = UInt8(MemoryLayout<sockaddr_in>.size)
    addr.sin_family = sa_family_t(AF_INET)
    addr.sin_port = in_port_t(Darwin.htons(UInt16(clamping: requested)))

    if localOnly {
      inet_pton(AF_INET, "127.0.0.1", &addr.sin_addr)
    } else {
      addr.sin_addr.s_addr = inet_addr("0.0.0.0")
    }

    let bindResult = withUnsafePointer(to: &addr) {
      $0.withMemoryRebound(to: sockaddr.self, capacity: 1) {
        bind(fd, $0, socklen_t(MemoryLayout<sockaddr_in>.size))
      }
    }
    guard bindResult == 0 else {
      close(fd)
      throw NSError(domain: "TinyHTTPServer", code: 2, userInfo: [NSLocalizedDescriptionKey: "bind() failed"])
    }

    guard listen(fd, 50) == 0 else {
      close(fd)
      throw NSError(domain: "TinyHTTPServer", code: 3, userInfo: [NSLocalizedDescriptionKey: "listen() failed"])
    }

    var sin = sockaddr_in()
    var len = socklen_t(MemoryLayout<sockaddr_in>.size)
    let gs = withUnsafeMutablePointer(to: &sin) {
      $0.withMemoryRebound(to: sockaddr.self, capacity: 1) {
        getsockname(fd, $0, &len)
      }
    }
    guard gs == 0 else {
      close(fd)
      throw NSError(domain: "TinyHTTPServer", code: 4, userInfo: [NSLocalizedDescriptionKey: "getsockname() failed"])
    }
    let assignedPort = Int(Darwin.ntohs(sin.sin_port))

    stateLock.lock()
    listenFD = fd
    running = true
    stateLock.unlock()

    let thread = Thread { [weak self] in
      self?.acceptLoop()
    }
    thread.name = "TinyHTTPServer-accept"
    thread.start()
    acceptThread = thread

    return assignedPort
  }

  func stop() {
    stateLock.lock()
    running = false
    let fd = listenFD
    listenFD = -1
    stateLock.unlock()

    if fd >= 0 {
      shutdown(fd, SHUT_RDWR)
      close(fd)
    }
    acceptThread?.cancel()
    acceptThread = nil
  }

  private func acceptLoop() {
    while true {
      stateLock.lock()
      let fd = listenFD
      let isRunning = running
      stateLock.unlock()
      if !isRunning || fd < 0 {
        break
      }

      var clientAddr = sockaddr_in()
      var clientLen = socklen_t(MemoryLayout<sockaddr_in>.size)
      let clientFD = withUnsafeMutablePointer(to: &clientAddr) {
        $0.withMemoryRebound(to: sockaddr.self, capacity: 1) {
          accept(fd, $0, &clientLen)
        }
      }
      if clientFD < 0 {
        continue
      }

      DispatchQueue.global(qos: .utility).async { [weak self] in
        self?.handleClient(fd: clientFD)
      }
    }
  }

  private func handleClient(fd: Int32) {
    defer { close(fd) }

    var buffer = [UInt8](repeating: 0, count: 8192)
    var total = Data()

    while total.count < 65536 {
      let n = read(fd, &buffer, buffer.count)
      if n <= 0 {
        return
      }
      total.append(buffer, count: n)
      if let range = total.range(of: Data([13, 10, 13, 10])) {
        total = total.subdata(in: 0 ..< range.lowerBound)
        break
      }
    }

    guard let headerText = String(data: total, encoding: .utf8),
          let firstLine = headerText.split(separator: "\r\n").first
    else {
      return
    }

    let parts = firstLine.split(separator: " ")
    guard parts.count >= 2, parts[0] == "GET" else {
      sendResponse(fd: fd, status: 405, body: Data("Method Not Allowed".utf8), contentType: "text/plain; charset=utf-8")
      return
    }

    var rawPath = String(parts[1])
    if let q = rawPath.firstIndex(of: "?") {
      rawPath = String(rawPath[..<q])
    }
    if rawPath.hasPrefix("/") {
      rawPath.removeFirst()
    }

    let decoded = rawPath.removingPercentEncoding ?? rawPath
    let fileURL = rootURL.appendingPathComponent(decoded, isDirectory: false)

    let rootCanonical: String
    let fileCanonical: String
    do {
      rootCanonical = try rootURL.resolvingSymlinksInPath().standardizedFileURL.path
      fileCanonical = try fileURL.resolvingSymlinksInPath().standardizedFileURL.path
    } catch {
      sendResponse(fd: fd, status: 403, body: Data("Forbidden".utf8), contentType: "text/plain; charset=utf-8")
      return
    }

    let rootWithSep = rootCanonical.hasSuffix("/") ? rootCanonical : rootCanonical + "/"
    guard fileCanonical == rootCanonical || fileCanonical.hasPrefix(rootWithSep) else {
      sendResponse(fd: fd, status: 403, body: Data("Forbidden".utf8), contentType: "text/plain; charset=utf-8")
      return
    }

    var isDir: ObjCBool = false
    guard FileManager.default.fileExists(atPath: fileCanonical, isDirectory: &isDir), !isDir.boolValue else {
      sendResponse(fd: fd, status: 404, body: Data("Not Found".utf8), contentType: "text/plain; charset=utf-8")
      return
    }

    guard let body = try? Data(contentsOf: URL(fileURLWithPath: fileCanonical)) else {
      sendResponse(fd: fd, status: 404, body: Data("Not Found".utf8), contentType: "text/plain; charset=utf-8")
      return
    }

    let mime = Self.mimeType(for: fileCanonical)
    sendResponse(fd: fd, status: 200, body: body, contentType: mime)
  }

  private func sendResponse(fd: Int32, status: Int, body: Data, contentType: String) {
    let reason: String
    switch status {
    case 200: reason = "OK"
    case 403: reason = "Forbidden"
    case 404: reason = "Not Found"
    case 405: reason = "Method Not Allowed"
    default: reason = "Error"
    }

    let header =
      "HTTP/1.1 \(status) \(reason)\r\nContent-Type: \(contentType)\r\nContent-Length: \(body.count)\r\nConnection: close\r\n\r\n"
    guard let headerData = header.data(using: .ascii) else { return }

    var combined = headerData
    combined.append(body)
    combined.withUnsafeBytes { raw in
      guard let base = raw.baseAddress else { return }
      _ = write(fd, base, combined.count)
    }
  }

  private static func mimeType(for path: String) -> String {
    let lower = (path as NSString).pathExtension.lowercased()
    switch lower {
    case "html", "htm": return "text/html; charset=utf-8"
    case "css": return "text/css; charset=utf-8"
    case "js": return "application/javascript; charset=utf-8"
    case "json": return "application/json"
    case "png": return "image/png"
    case "jpg", "jpeg": return "image/jpeg"
    case "gif": return "image/gif"
    case "svg": return "image/svg+xml"
    case "webp": return "image/webp"
    case "ico": return "image/x-icon"
    case "woff2": return "font/woff2"
    case "woff": return "font/woff"
    case "ttf": return "font/ttf"
    case "map": return "application/json"
    case "xml": return "application/xml"
    default: return "application/octet-stream"
    }
  }
}
