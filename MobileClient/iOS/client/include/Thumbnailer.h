#import <UIKit/UIKit.h>
#import <Foundation/Foundation.h>
#import "ThumbnailerConfig.h"

typedef enum _ThumbnailerState
{
    ThumbnailerOpening  = 0,
    ThumbnailerOpened   = 1,
    ThumbnailerClosing  = 2,
    ThumbnailerClosed   = 3
    
} ThumbnailerState;

@interface Thumbnailer : NSObject

- (NSCondition*) Open: (ThumbnailerConfig*)config;
- (void) Close;

- (ThumbnailerConfig*) getConfig;

- (ThumbnailerState) getState;
- (NSString*) getInfo;

@end














