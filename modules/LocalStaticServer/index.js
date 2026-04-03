import {NativeModules} from 'react-native';

const {LocalStaticServer} = NativeModules;

/**
 * @param {{ rootPath: string; port?: number; localOnly?: boolean }} options
 * @returns {Promise<string>} Base URL e.g. http://127.0.0.1:54321
 */
export function start(options = {}) {
  if (!LocalStaticServer) {
    return Promise.reject(
      new Error('LocalStaticServer native module is not linked'),
    );
  }
  const {rootPath, port = 0, localOnly = true} = options;
  if (!rootPath) {
    return Promise.reject(new Error('local-static-server: rootPath is required'));
  }
  return LocalStaticServer.start(rootPath, port, localOnly);
}

export function stop() {
  if (!LocalStaticServer) {
    return Promise.resolve();
  }
  return LocalStaticServer.stop();
}
