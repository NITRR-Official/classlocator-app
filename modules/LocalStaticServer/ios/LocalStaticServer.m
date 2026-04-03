#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(LocalStaticServer, NSObject)

RCT_EXTERN_METHOD(start:(NSString *)rootPath
                  port:(nonnull NSNumber *)port
                  localOnly:(BOOL)localOnly
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(stop:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

@end
