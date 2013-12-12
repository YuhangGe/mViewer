//
//  Asset.m
//  HelloWorld
//
//  Created by 葛羽航 on 13-8-1.
//
//

#import "Asset.h"
#import <Cordova/CDV.h>
#include<AssetsLibrary/AssetsLibrary.h>

@implementation Asset

//@synthesize commandId;

- (void)getAllGroups:(CDVInvokedUrlCommand *)command
{
    ALAssetsLibrary* library =  [[ALAssetsLibrary alloc] init];
    
//    self.commandId = command.callbackId;
    
    NSMutableArray* assetGroups = [[NSMutableArray alloc] init];
    
    void (^ assetGroupEnumerator) ( ALAssetsGroup *, BOOL *)= ^(ALAssetsGroup *group, BOOL *stop) {
        
        
        if(group != nil) {
            NSString* g_name = [group valueForProperty:ALAssetsGroupPropertyName];
//            enum {
//                ALAssetsGroupLibrary        = (1 << 0),
//                ALAssetsGroupAlbum          = (1 << 1),
//                ALAssetsGroupEvent          = (1 << 2),
//                ALAssetsGroupFaces          = (1 << 3),
//                ALAssetsGroupSavedPhotos    = (1 << 4),
//                ALAssetsGroupPhotoStream    = (1 << 5),
//                ALAssetsGroupAll            = 0xFFFFFFFF,
//            };
//
            NSNumber* g_type = [group valueForProperty:ALAssetsGroupPropertyType];
            NSNumber* g_number =  [NSNumber numberWithInt:[group numberOfAssets]];
            UIImage* _img = [UIImage imageWithCGImage:[group posterImage]];
//            NSLog(@"size: %f, %f", _img.size.width, _img.size.height);
            CGSize newSize = CGSizeMake(100 ,100);
            UIGraphicsBeginImageContext(newSize);
            [_img drawInRect:CGRectMake(0,0,newSize.width,newSize.height)];
            UIImage* dst_small = UIGraphicsGetImageFromCurrentImageContext();
            UIGraphicsEndImageContext();
            
            NSData* _data = UIImageJPEGRepresentation(dst_small, 0.9);
            NSString* src = [_data base64EncodedString];
            
           // [group enumerateAssetsUsingBlock:assetEnumerator];
            NSDictionary* _g = [NSDictionary dictionaryWithObjectsAndKeys:g_name, @"name", g_type, @"type", src, @"poster", g_number, @"number", nil];
//            NSLog(@"g: %@", _g);
            
            [assetGroups addObject:_g];
            
        //    count=[group numberOfAssets];
            
        } else {
            [self.commandDelegate sendPluginResult:[CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsArray:assetGroups]
                                        callbackId:command.callbackId ];
            
                   }
        
    };
    
    
    
    
    [library enumerateGroupsWithTypes:ALAssetsGroupAll
     
                           usingBlock:assetGroupEnumerator
     
                         failureBlock:^(NSError *error) {
                             [self.commandDelegate sendPluginResult:[CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:@"could not access the library"]
                                                         callbackId:command.callbackId ];
                         }];
}


-(void)getAllAssetsByGroupName:(CDVInvokedUrlCommand *)command
{
    NSString* name = [command.arguments objectAtIndex:0];
    
    ALAssetsLibrary* library =  [[ALAssetsLibrary alloc] init];
    NSMutableArray* assetsArray = [[NSMutableArray alloc] init];

    
    void (^assetEnumerator)( ALAsset *, NSUInteger, BOOL *) = ^(ALAsset *result, NSUInteger index, BOOL *stop) {
        
        if(result != nil) {
            
            if([[result valueForProperty:ALAssetPropertyType] isEqualToString:ALAssetTypePhoto]) {
                
               
                NSString* url = [[[result defaultRepresentation] url] absoluteString];
                
                UIImage* _img = [UIImage imageWithCGImage:[result thumbnail]];
//                NSLog(@"size: %f, %f", _img.size.width, _img.size.height);
                
                CGSize newSize = CGSizeMake(90 ,90);
                UIGraphicsBeginImageContext(newSize);
                [_img drawInRect:CGRectMake(0,0,newSize.width,newSize.height)];
                UIImage* dst_small = UIGraphicsGetImageFromCurrentImageContext();
                UIGraphicsEndImageContext();
                
                NSData* _data = UIImageJPEGRepresentation(dst_small, 0.8);
               
                NSString* src = [_data base64EncodedString];
                
                NSDictionary* ass = [NSDictionary dictionaryWithObjectsAndKeys:url, @"url", src, @"thumbnail", nil];
                
//                NSLog(@"ass: %@", ass);

                [assetsArray addObject:ass];
                
                    
                
            }
            
        } else {
            [self.commandDelegate sendPluginResult:[CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsArray:assetsArray]
                                        callbackId:command.callbackId ];
        }
        
    };
    

    
    __block BOOL found_group = NO;
    
    void (^ assetGroupEnumerator) ( ALAssetsGroup *, BOOL *)= ^(ALAssetsGroup *group, BOOL *stop) {
        
        
        if(group != nil) {
            NSString* g_name = [group valueForProperty:ALAssetsGroupPropertyName];
//            NSLog(@"check: %@", g_name);
            
            if([g_name compare:name]==NSOrderedSame) {
                *stop = YES;
                found_group = YES;
                [group enumerateAssetsUsingBlock:assetEnumerator];
                
            }
        } else {
            if(found_group==NO) {
                [self.commandDelegate sendPluginResult:[CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:@"not found group"]
                                            callbackId:command.callbackId ];
            }
        }
        
    };
    
    
    [library enumerateGroupsWithTypes:ALAssetsGroupAll
     
                           usingBlock:assetGroupEnumerator
     
                         failureBlock:^(NSError *error) {
                             [self.commandDelegate sendPluginResult:[CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:@"could not access the library"]
                                                         callbackId:command.callbackId ];
                         }];
  
}

-(void)deleteAssets:(CDVInvokedUrlCommand *)command
{
//    ALAssetsLibrary* library =  [[ALAssetsLibrary alloc] init];
    NSArray* arr = [command.arguments objectAtIndex:0];
    NSString* root_path = [command.arguments objectAtIndex:1];
    
    NSInteger total = [arr count];
    if(total==0) {
        [self.commandDelegate sendPluginResult:[CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR]
                                    callbackId:command.callbackId ];
    
        return;
    }
   
    NSFileManager* fileMgr = [[NSFileManager alloc] init];
    
    
    for(NSString* fn in arr) {
       
        @try {
            NSError* __autoreleasing pError = nil;
            NSString* fullPath = [root_path stringByAppendingFormat:@"/%@", fn];
            if(![fileMgr removeItemAtPath:fullPath error:&pError]) {
                goto _err;
            }
            NSRange r = [fn rangeOfString:@"." options:NSBackwardsSearch];
            if(r.location==NSNotFound) {
                goto _err;
            }
            NSString* thumbPath = [root_path stringByAppendingFormat:@"/thumbnails/%@.thumb.png", [fn substringToIndex:r.location]];
            if(![fileMgr removeItemAtPath:thumbPath error:&pError]) {
                goto _err;
            }
        } @catch(NSException* e) {  // NSInvalidArgumentException if path is . or ..
            goto _err;
        }

    }
    
    [self.commandDelegate sendPluginResult:[CDVPluginResult resultWithStatus:CDVCommandStatus_OK]
                                callbackId:command.callbackId ];
      return;
    
_err:
    
    [self.commandDelegate sendPluginResult:[CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR]
                                callbackId:command.callbackId ];
    
  }

-(void)renameAssets:(CDVInvokedUrlCommand *)command
{
//    ALAssetsLibrary* library =  [[ALAssetsLibrary alloc] init];
    NSString* new_name = [command.arguments objectAtIndex:0];
    NSArray* arr = [command.arguments objectAtIndex:1];
    NSString* root_path = [command.arguments objectAtIndex:2];
    NSInteger total = [arr count];
    if(total==0) {
        [self.commandDelegate sendPluginResult:[CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR]
                                    callbackId:command.callbackId ];
              return;
    }
    NSFileManager* fileMgr = [[NSFileManager alloc] init];
    int i = 0;
    for(NSString* fn in arr) {        
        @try {
            NSRange r = [fn rangeOfString:@"." options:NSBackwardsSearch];
            if(r.location==NSNotFound) {
                [self.commandDelegate sendPluginResult:[CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR]
                                            callbackId:command.callbackId ];
                return;
            }
            NSString* _name = [fn substringToIndex:r.location];
            NSString* _post = [fn substringFromIndex:r.location+1];
            
            i++;
           
            NSString* fullPath = [root_path stringByAppendingFormat:@"/%@", fn];
            NSString* thumbPath = [root_path stringByAppendingFormat:@"/thumbnails/%@.thumb.png", _name];
            NSString* renameFullPath = [root_path stringByAppendingFormat:@"/%@(%d).%@", new_name, i, _post];
            NSString* renameThumbPath = [root_path stringByAppendingFormat:@"/thumbnails/%@(%d).thumb.png", new_name, i];
            NSError* __autoreleasing pError = nil;
            
        
            
            if(![fileMgr moveItemAtPath:fullPath toPath:renameFullPath error:&pError]) {
                [self.commandDelegate sendPluginResult:[CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR]
                                            callbackId:command.callbackId ];
                return;

            }
            
            if(![fileMgr moveItemAtPath:thumbPath toPath:renameThumbPath error:&pError]) {
                [self.commandDelegate sendPluginResult:[CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR]
                                            callbackId:command.callbackId ];
                return;

            }
            
        } @catch(NSException* e) {  // NSInvalidArgumentException if path is . or ..
            [self.commandDelegate sendPluginResult:[CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR]
                                        callbackId:command.callbackId ];
            return;

        }
        
    }
    
    [self.commandDelegate sendPluginResult:[CDVPluginResult resultWithStatus:CDVCommandStatus_OK]
                                callbackId:command.callbackId ];
    return;
    
    
}


-(void)saveAssets:(CDVInvokedUrlCommand *)command
{
    ALAssetsLibrary* library =  [[ALAssetsLibrary alloc] init];
    
    NSArray* url_arr = [command.arguments objectAtIndex:0];
    NSString* file_name = [command.arguments objectAtIndex:1];
    NSString* path = [command.arguments objectAtIndex:2];

    NSInteger total = [url_arr count];
    __block int cur = 0;
    if(total==0) {
        [self.commandDelegate sendPluginResult:[CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR]
                                    callbackId:command.callbackId ];
        
    } else {
        for(NSString* url in url_arr) {
            [library assetForURL:[NSURL URLWithString:url] resultBlock:^(ALAsset *asset) {
                
                UIImage* img = [UIImage imageWithCGImage:[[asset defaultRepresentation] fullResolutionImage]];
                NSData* data = UIImagePNGRepresentation(img);
                NSString* save_file = [path stringByAppendingFormat:@"/%@(%d).png", file_name, cur+1];
//                NSLog(@"file:%@", save_file);
                if(![data writeToFile:save_file atomically:TRUE]) {
                    [self.commandDelegate sendPluginResult:[CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:@"error on write image file"]
                                                callbackId:command.callbackId ];
                } else {
//                    NSLog(@"write image %@", save_file);
                }
                cur++;
                if(cur==total) {
                    [self.commandDelegate sendPluginResult:[CDVPluginResult resultWithStatus:CDVCommandStatus_OK]
                                                callbackId:command.callbackId ];
                }
            } failureBlock:^(NSError *error) {
                [self.commandDelegate sendPluginResult:[CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:@"could not access the library"]
                                            callbackId:command.callbackId ];
                
            }];
        }

    }
    
    
}

-(void)setScreenLock:(CDVInvokedUrlCommand *)command
{
    NSNumber* _lock = [command.arguments objectAtIndex:0];
    if([_lock intValue]==0) {
        //unlock
        [[UIApplication sharedApplication] setIdleTimerDisabled:NO];
    } else {
        //lock
        [[UIApplication sharedApplication] setIdleTimerDisabled:YES];

    }
    [self.commandDelegate sendPluginResult:[CDVPluginResult resultWithStatus:CDVCommandStatus_OK]
                                callbackId:command.callbackId ];

}

-(void)setStatusBar:(CDVInvokedUrlCommand *)command
{
    NSNumber* _show = [command.arguments objectAtIndex:0];
    if([_show intValue]==0){
        [[UIApplication sharedApplication] setStatusBarHidden:YES withAnimation:UIStatusBarAnimationNone];
    } else {
        [[UIApplication sharedApplication] setStatusBarHidden:NO withAnimation:UIStatusBarAnimationNone];
    }
}
@end
