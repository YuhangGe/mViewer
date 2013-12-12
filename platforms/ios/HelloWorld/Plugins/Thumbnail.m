//
//  Thumbnail.m
//  HelloWorld
//
//  Created by 葛羽航 on 13-7-26.
//
//

#import "Thumbnail.h"
#import <Cordova/CDV.h>


@implementation Thumbnail


- (void)saveBySize:(CDVInvokedUrlCommand *)command
{
    CDVPluginResult* pluginResult = nil;
    NSString* src_file_path = [command.arguments objectAtIndex:0];
    NSString* dst_file_path = [command.arguments objectAtIndex:1];
    NSNumber* n_width = [command.arguments objectAtIndex:2];
    NSNumber* n_height = [command.arguments objectAtIndex:3];
    
    int dst_w = 0, dst_h = 0;
    if(n_width!=nil && n_height!=nil){
        dst_w = [n_width floatValue];
        dst_h = [n_height floatValue];
    }
    
    if(src_file_path == nil || [src_file_path length]==0 || dst_file_path==nil || [dst_file_path length]==0 || dst_w <=0 || dst_h<=0) {
        pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
        return;
        
    }
    float f_scale = 1.0;
        
    UIImage* src_img = [UIImage imageWithContentsOfFile:src_file_path];
    
    if(src_img == nil){
        pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
        return;
    }
    
    int src_w = src_img.size.width, src_h = src_img.size.height;
    float f_w = (float)src_w / (float)dst_w, f_h = (float)src_h / (float)dst_h;
    if(f_w>f_h){
        f_scale = f_w;
    } else {
        f_scale = f_h;
    }
    
    CGSize newSize = CGSizeMake((float)src_w/f_scale,  (float)src_h/f_scale);
    
    UIGraphicsBeginImageContext(newSize);
    [src_img drawInRect:CGRectMake(0,0,newSize.width,newSize.height)];
    UIImage* dst_small = UIGraphicsGetImageFromCurrentImageContext();
    UIGraphicsEndImageContext();
   
    NSData *pngData = UIImagePNGRepresentation(dst_small);
        
    if(![pngData writeToFile:dst_file_path atomically:YES])
    {
        pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
        return;
    }

    pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK];
    [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
    return;
  

}
@end
