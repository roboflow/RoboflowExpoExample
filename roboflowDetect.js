import "react-native-reanimated";

export const roboflowDetect = (frame) => {
  "worklet";
  return [__roboflowDetect(frame), frame.width, frame.height];
};
