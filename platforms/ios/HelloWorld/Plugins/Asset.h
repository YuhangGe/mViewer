//
//  Asset.h
//  HelloWorld
//
//  Created by 葛羽航 on 13-8-1.
//
//

#import <Cordova/CDV.h>

@interface Asset : CDVPlugin

//@property (strong) NSString* commandId;

-(void)setScreenLock:(CDVInvokedUrlCommand*)command;

- (void)getAllGroups:(CDVInvokedUrlCommand*)command;

- (void)getAllAssetsByGroupName:(CDVInvokedUrlCommand*)command;

- (void)saveAssets: (CDVInvokedUrlCommand*) command;

- (void)deleteAssets: (CDVInvokedUrlCommand*) command;

-(void)renameAssets:(CDVInvokedUrlCommand*) command;

-(void)setStatusBar:(CDVInvokedUrlCommand*) command;

@end
