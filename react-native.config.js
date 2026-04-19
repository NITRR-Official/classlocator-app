'use strict';

/**
 * Android autolinking for local-static-server is disabled here and wired manually in
 * android/settings.gradle, android/app/build.gradle, and MainApplication.kt.
 * That avoids stale android/build/generated/autolinking/autolinking.json omitting the
 * file: dependency so NativeModules.LocalStaticServer stays undefined.
 */
module.exports = {
  dependencies: {
    'local-static-server': {
      platforms: {
        android: null,
      },
    },
  },
};
