import "react-native-reanimated";
import { StyleSheet, Text, View, Dimensions } from "react-native";
import {
  useCameraDevices,
  Camera,
  useFrameProcessor,
} from "react-native-vision-camera";
import { roboflowDetect } from "./roboflowDetect";
import { useState } from "react";
import { runOnJS } from "react-native-reanimated";

export default function App() {
  const devices = useCameraDevices("wide-angle-camera");
  const device = devices.back;
  const [boxes, setBoxes] = useState(0);
  const [fps, setFps] = useState(0);
  const windowWidth = Dimensions.get("window").width;
  const windowHeight = Dimensions.get("window").height;
  var lastRunTime = Date.now();

  const updateBboxes = (bs) => {
    setFps(1 / ((Date.now() - lastRunTime) / 1000));
    setBoxes(bs);
    lastRunTime = Date.now();
  };

  const frameProcessor = useFrameProcessor((frame) => {
    "worklet";
    const [detections, width, height] = roboflowDetect(frame);
    for (let i = 0; i < detections.length; i++) {
      var b = detections[i];
      b.x = b.x * (windowWidth / width);
      b.y = b.y * (windowHeight / height);
      b.width = b.width * (windowWidth / width);
      b.height = b.height * (windowHeight / height);
      detections[i] = b;
    }
    runOnJS(updateBboxes)(detections);
    console.log(`Detections in Frame: ${JSON.stringify(detections)}`);
  }, []);

  if (device == null) return <Text>Hello World</Text>;
  return (
    <View style={{ flex: 1 }}>
      <View
        style={{
          position: "absolute",
          flex: 1,
          zIndex: 9,
          margin: 100,
        }}
      ></View>

      <Camera
        style={StyleSheet.absoluteFill}
        frameProcessor={frameProcessor}
        device={device}
        isActive={true}
        fps={60}
      >
        {boxes != undefined &&
          boxes.length > 0 &&
          boxes.map((box) => (
            <View
              style={{
                borderColor: `rgb(${box.color[0]},${box.color[1]},${box.color[2]})`,
                borderWidth: 2,
                borderStyle: "solid",
                width: box.width,
                height: box.height,
                left: box.x - box.width / 2,
                top: box.y - box.height / 2,
                backgroundColor: "rgba(255, 255, 255, 0)",
                position: "absolute",
                zIndex: 10,
              }}
            >
              <Text
                style={{
                  color: `rgb(${box.color[0]},${box.color[1]},${box.color[2]})`,
                }}
              >
                {box.class} {Math.round(box.confidence * 100) / 100}
              </Text>
            </View>
          ))}
        <Text style={{ marginTop: 60, marginLeft: 16 }}>
          FPS: {Math.round(fps)}
        </Text>
      </Camera>
    </View>
  );
}
