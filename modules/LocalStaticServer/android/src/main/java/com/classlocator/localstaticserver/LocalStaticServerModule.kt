package com.classlocator.localstaticserver

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.io.File

class LocalStaticServerModule(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  private var server: StaticHttpServer? = null

  override fun getName(): String = NAME

  @ReactMethod
  fun start(rootPath: String, port: Double, localOnly: Boolean, promise: Promise) {
    try {
      synchronized(this) {
        server?.stop()
        server = null
        val root = File(rootPath)
        if (!root.isDirectory) {
          promise.reject("E_INVALID_ROOT", "Root path is not a directory: $rootPath")
          return
        }
        val portInt = port.toInt()
        val srv = StaticHttpServer(root, localOnly, portInt)
        srv.start()
        server = srv
        val p = srv.localPort
        // Use "localhost" for localOnly so URLs match network_security_config cleartext rules
        // (127.0.0.1 was blocked when only "localhost" was listed). Server still binds to 127.0.0.1.
        val host = if (localOnly) "localhost" else "0.0.0.0"
        promise.resolve("http://$host:$p")
      }
    } catch (e: Exception) {
      promise.reject("E_START_FAILED", e.message, e)
    }
  }

  @ReactMethod
  fun stop(promise: Promise) {
    try {
      synchronized(this) {
        server?.stop()
        server = null
      }
      promise.resolve(null)
    } catch (e: Exception) {
      promise.reject("E_STOP_FAILED", e.message, e)
    }
  }

  companion object {
    const val NAME = "LocalStaticServer"
  }
}
