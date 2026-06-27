const { withAndroidManifest } = require('@expo/config-plugins');

module.exports = function withAndroidQueries(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;

    if (!manifest.queries) {
      manifest.queries = [];
    }

    const queriesToAdd = [
      {
        package: [{ $: { 'android:name': 'com.google.android.apps.nbu.paisa.user' } }] // GPay
      },
      {
        package: [{ $: { 'android:name': 'com.phonepe.app' } }] // PhonePe
      },
      {
        package: [{ $: { 'android:name': 'net.one97.paytm' } }] // Paytm
      },
      {
        package: [{ $: { 'android:name': 'in.org.npci.upiapp' } }] // BHIM
      },
      {
        package: [{ $: { 'android:name': 'in.amazon.mShop.android.shopping' } }] // Amazon Pay
      },
      {
        package: [{ $: { 'android:name': 'com.mobikwik_new' } }] // Mobikwik
      },
      {
        intent: [
          {
            action: [{ $: { 'android:name': 'android.intent.action.VIEW' } }],
            data: [{ $: { 'android:scheme': 'upi' } }]
          }
        ]
      },
      {
        intent: [
          {
            action: [{ $: { 'android:name': 'android.intent.action.VIEW' } }],
            data: [{ $: { 'android:scheme': 'phonepe' } }]
          }
        ]
      },
      {
        intent: [
          {
            action: [{ $: { 'android:name': 'android.intent.action.VIEW' } }],
            data: [{ $: { 'android:scheme': 'paytmmp' } }]
          }
        ]
      }
    ];

    manifest.queries = [...manifest.queries, ...queriesToAdd];

    return config;
  });
};
