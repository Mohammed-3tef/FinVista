package com.haweshly

import android.content.Intent
import android.os.Bundle
import com.facebook.react.HeadlessJsTaskService
import com.facebook.react.bridge.Arguments
import com.facebook.react.jstasks.HeadlessJsTaskConfig

/**
 * HeadlessJsTaskService that runs the JS "SmsCheckTask" even when the app is killed.
 * Started by SmsBroadcastReceiver when a new SMS arrives or on device boot.
 */
class SmsCheckTaskService : HeadlessJsTaskService() {

    override fun getTaskConfig(intent: Intent?): HeadlessJsTaskConfig? {
        val extras: Bundle? = intent?.extras
        val data = if (extras != null) Arguments.fromBundle(extras) else Arguments.createMap()
        return HeadlessJsTaskConfig(
            "SmsCheckTask",   // must match AppRegistry.registerHeadlessTask name in index.js
            data,
            5_000L,           // timeout ms
            true              // allow in foreground too
        )
    }
}
