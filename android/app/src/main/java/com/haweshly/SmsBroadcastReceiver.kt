package com.haweshly

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

/**
 * Listens for:
 *  - android.provider.Telephony.SMS_RECEIVED  → triggers JS SMS check immediately
 *  - android.intent.action.BOOT_COMPLETED     → re-arms WorkManager jobs after reboot
 *
 * Works even when the app is completely killed.
 */
class SmsBroadcastReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        when (intent.action) {
            "android.provider.Telephony.SMS_RECEIVED",
            "android.intent.action.BOOT_COMPLETED" -> {
                val serviceIntent = Intent(context, SmsCheckTaskService::class.java)
                context.startService(serviceIntent)
            }
        }
    }
}
