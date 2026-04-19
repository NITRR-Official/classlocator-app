'use strict';

module.exports = {
  dependency: {
    platforms: {
      android: {
        packageImportPath: 'import com.classlocator.localstaticserver.LocalStaticServerPackage;',
        packageInstance: 'new LocalStaticServerPackage()',
      },
      ios: {},
    },
  },
};
