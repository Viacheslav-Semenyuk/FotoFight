package com.fotofight.app

import android.util.Log
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise

class NativeLoggerModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
  
  override fun getName(): String {
    return "NativeLogger"
  }

  @ReactMethod
  fun log(level: String, tag: String, message: String) {
    when (level.uppercase()) {
      "ERROR" -> Log.e(tag, message)
      "WARN" -> Log.w(tag, message)
      "INFO" -> Log.i(tag, message)
      "DEBUG" -> Log.d(tag, message)
      else -> Log.d(tag, message)
    }
  }

  @ReactMethod
  fun logWithData(level: String, tag: String, message: String, data: String) {
    val fullMessage = if (data.isNotEmpty()) "$message | Data: $data" else message
    log(level, tag, fullMessage)
  }
}
