package com.classlocator.localstaticserver

import android.util.Log
import java.io.BufferedOutputStream
import java.io.BufferedReader
import java.io.File
import java.io.FileInputStream
import java.io.InputStreamReader
import java.net.InetAddress
import java.net.ServerSocket
import java.net.Socket
import java.net.SocketException
import java.net.URLDecoder
import java.nio.charset.StandardCharsets
import java.util.concurrent.atomic.AtomicBoolean

/**
 * Minimal HTTP/1.1 static file server bound to loopback or all interfaces.
 */
internal class StaticHttpServer(
  private val rootDir: File,
  private val localOnly: Boolean,
  requestedPort: Int,
) {
  private var serverSocket: ServerSocket? = null
  private var acceptThread: Thread? = null
  private val running = AtomicBoolean(false)

  val localPort: Int
    get() = serverSocket?.localPort ?: -1

  init {
    val bindAddr =
      if (localOnly) {
        InetAddress.getByName("127.0.0.1")
      } else {
        InetAddress.getByName("0.0.0.0")
      }
    val port = if (requestedPort > 0) requestedPort else 0
    serverSocket = ServerSocket(port, 50, bindAddr)
  }

  fun start() {
    if (running.getAndSet(true)) {
      return
    }
    val socket = serverSocket ?: return
    acceptThread =
      Thread(
          {
            while (running.get()) {
              try {
                val client = socket.accept()
                Thread({ handleClient(client) }, "static-http-worker").start()
              } catch (e: SocketException) {
                if (running.get()) {
                  Log.w(TAG, "accept interrupted", e)
                }
              } catch (e: Exception) {
                Log.e(TAG, "accept failed", e)
              }
            }
          },
          "static-http-accept",
        )
          .apply {
            isDaemon = true
            start()
          }
  }

  fun stop() {
    running.set(false)
    try {
      serverSocket?.close()
    } catch (_: Exception) {
    }
    serverSocket = null
    acceptThread?.interrupt()
    acceptThread = null
  }

  private fun handleClient(socket: Socket) {
    socket.use { s ->
      try {
        val reader = BufferedReader(InputStreamReader(s.getInputStream(), StandardCharsets.US_ASCII))
        val firstLine = reader.readLine() ?: return
        // Drain request headers
        while (true) {
          val line = reader.readLine() ?: break
          if (line.isEmpty()) break
        }

        val parts = firstLine.split("\\s+".toRegex())
        if (parts.size < 2 || parts[0] != "GET") {
          writeError(s, 405, "Method Not Allowed")
          return
        }

        var path = parts[1].substringBefore("?")
        if (path.startsWith("/")) {
          path = path.substring(1)
        }
        val decoded =
          try {
            URLDecoder.decode(path, StandardCharsets.UTF_8.name())
          } catch (_: Exception) {
            path
          }

        val canonicalRoot = rootDir.canonicalFile
        val requested = File(canonicalRoot, decoded).canonicalFile
        if (!requested.path.startsWith(canonicalRoot.path + File.separator) &&
          requested != canonicalRoot
        ) {
          writeError(s, 403, "Forbidden")
          return
        }
        if (!requested.isFile) {
          writeError(s, 404, "Not Found")
          return
        }

        val mime = mimeType(requested.name)
        val length = requested.length()
        val header =
          buildString {
            append("HTTP/1.1 200 OK\r\n")
            append("Content-Type: ")
            append(mime)
            append("\r\n")
            append("Content-Length: ")
            append(length)
            append("\r\n")
            append("Connection: close\r\n")
            append("\r\n")
          }
        val out = BufferedOutputStream(s.getOutputStream())
        out.write(header.toByteArray(StandardCharsets.US_ASCII))
        FileInputStream(requested).use { fis ->
          val buf = ByteArray(8192)
          while (true) {
            val n = fis.read(buf)
            if (n <= 0) break
            out.write(buf, 0, n)
          }
        }
        out.flush()
      } catch (e: Exception) {
        Log.w(TAG, "handleClient", e)
      }
    }
  }

  private fun writeError(socket: Socket, code: Int, message: String) {
    val body = message.toByteArray(StandardCharsets.UTF_8)
    val text =
      buildString {
        append("HTTP/1.1 ")
        append(code)
        append(' ')
        append(
          when (code) {
            403 -> "Forbidden"
            404 -> "Not Found"
            405 -> "Method Not Allowed"
            else -> "Error"
          },
        )
        append("\r\nContent-Type: text/plain; charset=utf-8\r\nContent-Length: ")
        append(body.size)
        append("\r\nConnection: close\r\n\r\n")
      }
    try {
      val out = socket.getOutputStream()
      out.write(text.toByteArray(StandardCharsets.US_ASCII))
      out.write(body)
      out.flush()
    } catch (_: Exception) {
    }
  }

  private fun mimeType(fileName: String): String {
    val lower = fileName.lowercase()
    return when {
      lower.endsWith(".html") || lower.endsWith(".htm") -> "text/html; charset=utf-8"
      lower.endsWith(".css") -> "text/css; charset=utf-8"
      lower.endsWith(".js") -> "application/javascript; charset=utf-8"
      lower.endsWith(".json") -> "application/json; charset=utf-8"
      lower.endsWith(".png") -> "image/png"
      lower.endsWith(".jpg") || lower.endsWith(".jpeg") -> "image/jpeg"
      lower.endsWith(".gif") -> "image/gif"
      lower.endsWith(".svg") -> "image/svg+xml"
      lower.endsWith(".webp") -> "image/webp"
      lower.endsWith(".ico") -> "image/x-icon"
      lower.endsWith(".woff2") -> "font/woff2"
      lower.endsWith(".woff") -> "font/woff"
      lower.endsWith(".ttf") -> "font/ttf"
      lower.endsWith(".map") -> "application/json"
      lower.endsWith(".xml") -> "application/xml"
      else -> "application/octet-stream"
    }
  }

  companion object {
    private const val TAG = "StaticHttpServer"
  }
}
