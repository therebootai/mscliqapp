const { withAndroidManifest } = require('@expo/config-plugins');

module.exports = function withAndroidConfigChanges(config) {
  return withAndroidManifest(config, (config) => {
    const androidManifest = config.modResults;
    
    // Find the main application
    const application = androidManifest.manifest.application?.[0];
    if (!application) return config;

    // Find MainActivity
    const activity = application.activity?.find(
      (a) => a.$['android:name'] === '.MainActivity'
    );

    if (activity) {
      // Set the configChanges to include the ones necessary to prevent restarts
      activity.$['android:configChanges'] = 
        'keyboard|keyboardHidden|orientation|screenSize|smallestScreenSize|screenLayout|uiMode|density|colorMode';
    }

    return config;
  });
};
