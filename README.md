# Getting Started with Roboflow in Expo

## Running the Example

Make sure Expo[https://expo.dev] and CocoaPods[https://cocoapods.org] are installed.

1. Clone the project.
2. Open the project and run `expo install`
3. Open the iOS directory in the project and run `pod install`
4. Open `RoboflowExpoExample.xcworkspace` in Xcode
5. Click on the project name on the left, then Signing and Capabilites, then select your team.
6. Open `RoboflowFrameProcessorPlugin.swift` in XCode and add your apiKey, model name, and model version from Roboflow[https://roboflow.com]
7. Run the app on a device using XCode

## Expo Project Setup

### Init Expo Project

Start by setting up an expo project if you haven't already using the `expo init <ProjectName>` command.

### Eject Project

Roboflow relies on native code which means you have to eject your expo project out of the managed workflow into the bare workflow. Note, this means you either have to use the EAS build system or compile the iOS app yourself in xcode. Eject using this command `expo prebuild`.

This will build the naive iOS and Android projects in the `ios` and `android` folders now present in your project. Roboflow only supports iOS for the time being so we will focus there first.

## Native iOS Project Setup

### Adding CocoaPod to Podfile

Roboflow is distributed using cocoapods, a package manager for native iOS apps. In order to install the app first open the `Podfile` in the iOS directory.

Under the line that says `config = use_native_modules!` add the Roboflow pod using the line `pod 'Roboflow'`.

### Change iOS target

Roboflow requires a minimum iOS version of 15.4. Edit the line at the top of the `Podfile` that says `platform :ios, '12.0'` and change it to `platform :ios, '15.4'`

### Installing New Cocoa Pod

Next, in a terminal window, run `pod install` to install the Roboflow package into your iOS project.

### Using Roboflow

Now that you have Roboflow installed you can use it in any native file, the remainder of the example will focus on using Roboflow to process a camera stream using the `react-native-vision-camera` package.

## react-native-vision-camera Installation

### Installing Package using NPM

Make sure you are in the root of your expo project (not the ios folder) and run `expo install react-native-vision-camera react-native-reanimated` to install react-native-vision-camera and its dependency react-native-reanimated.

### Install Pods

These npm dependencies also come bunled with native dependencies which we must also install. Run `pod install` in the ios directory.

## Using react-native-vision-camera

### Setting up a Native Frame Processor

react-native-vision-camera lets you use custom frame processors to process frames in the videos tream with high performance. Roboflow should be used in a swift frame processor like the one in this example called `RoboflowFrameProcessorPlugin.swift`.

You should first open the .xcworkspace file in the ios folder in XCode for easier development on this part.

### Configuring Camera Permissions

In XCode, open `Info.plist`. At the bottom click the little plus symbol while hovering over `View controller-based status bar appearance`. In the new row that appears, type `Privacy - Camera Usage Description` into the key column. Then type a custom message in the value column that will show when someone opens your app for the first time.

#### Adding Frame Processor

Either create a swift file called `RoboflowFrameProcessorPlugin.swift` or copy the one provided in this example. If XCode prompts you to create a bridging header file click create. Inside this frame processor we will implement roboflow for processing images in the incoming frames. First, we need to connect our swift file to the objective-c vision-camera library.

#### Setup Headers

In the `Bridging-Header.h` file add these two lines to the top.

```
#import <VisionCamera/FrameProcessorPlugin.h>
#import <VisionCamera/Frame.h>
```

Next create a file called `RoboflowFrameProcessorPlugin.m` with the following lines to tell expo where our function is.

```
#import <Foundation/Foundation.h>
#import <VisionCamera/FrameProcessorPlugin.h>

@interface VISION_EXPORT_SWIFT_FRAME_PROCESSOR(roboflowDetect, RoboflowFrameProcessorPlugin)
@end
```

#### Using Your Model

In RoboflowFrameProessorPlugin, we first define an instance of RoboflowWrapper with our apiKey. Insert your apiKey, found at roboflow.com. The loadRoboflowModelWith function loads your model from roboflow using the model name and version, set those values to your custom ones from roboflow.com.

Finally, custmize the confidence threshold, and overlap threshold to your desired values.

### Connecting Native Framework to Expo

#### Adding the Detect Function in Expo

In a new JS file, create a function called roboflowDetect which connects to your native function like so.

```
import "react-native-reanimated";

export const roboflowDetect = (frame) => {
  "worklet";
  return [__roboflowDetect(frame), frame.width, frame.height];
};
```

#### Add Worklet to babel config

Open the `babel.config.js` file to expose the native function to your react native app using react-native-reanimated. Make sure your file includes the plugins section from below.

```
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      [
        "react-native-reanimated/plugin",
        {
          globals: ["__roboflowDetect"],
        },
      ],
    ],
  };
};
```

#### Add react-native-vision-camera to App

In App.js add these imports.

```
import {
  useCameraDevices,
  Camera,
  useFrameProcessor,
} from "react-native-vision-camera";
import { roboflowDetect } from "./roboflowDetect";
import {
  runOnJS,
  useSharedValue,
} from "react-native-reanimated";
```

Then add these lines to get the camera device.

```
const devices = useCameraDevices("wide-angle-camera");
const device = devices.back;
if (device == null) return <Text>Loading...</Text>;
```

Next Add the the following lines to your return to add the camera.

```
<Camera
    style={StyleSheet.absoluteFill}
    device={device}
    isActive={true}
/>
```

#### Process Frames using roboflowDetect

To connect the camera to our frameprocessor lets first build a worklet function to access the native frame processor.

```
const frameProcessor = useFrameProcessor((frame) => {
    "worklet";
    const [detections, width, height] = roboflowDetect(frame);
    console.log(`Detections in Frame: ${detections.length}`);
}, []);
```

Then set the camera to use this worklet by adding `frameProcessor={frameProcessor}` to the `<Camera />` tag.
