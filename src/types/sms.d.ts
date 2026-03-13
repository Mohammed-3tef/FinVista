/**
 * Type declarations for react-native-get-sms-android
 * (package ships no .d.ts file)
 */
declare module 'react-native-get-sms-android' {
  interface SmsFilter {
    box?: 'inbox' | 'sent' | 'draft' | 'outbox' | 'failed' | 'queued' | '';
    minDate?: number;
    maxDate?: number;
    bodyRegex?: string;
    indexFrom?: number;
    maxCount?: number;
    address?: string;
    read?: 0 | 1;
    _id?: string;
    thread_id?: string;
  }

  const SmsAndroid: {
    list(
      filter: string,
      fail: (err: string) => void,
      success: (count: number, smsList: string) => void,
    ): void;
  };

  export default SmsAndroid;
}

/**
 * Type declarations for react-native-sms-listener
 * (package ships no .d.ts file)
 */
declare module 'react-native-sms-listener' {
  interface SmsListenerMessage {
    originatingAddress: string;
    body: string;
    timestamp: number;
  }

  interface SmsListenerSubscription {
    remove(): void;
  }

  const SmsListener: {
    addListener(handler: (message: SmsListenerMessage) => void): SmsListenerSubscription;
  };

  export default SmsListener;
}
