//
//  RoboflowFrameProcessorPlugin.swift
//  TelePharmDeployTesting
//
//  Created by Maxwell Stone on 4/20/22.
//

import Foundation
import Roboflow
import CoreImage
@objc(RoboflowFrameProcessorPlugin)
public class RoboflowFrameProcessorPlugin: NSObject, FrameProcessorPluginBase {
  
  static let rf = RoboflowWrapper(apiKey: "YOUR-API-KEY")
  static private var model: RFObjectDetectionModel?
  static private var loading = false
  static private var detectionsBuffer = [[Detection]]()
  
  private static func loadRoboflowModelWith(model: String, version: Int, threshold: Double, overlap: Double, maxObjects: Float) {
    loading = true
      rf.load(model: model, modelVersion: version) { [self] model, error, modelName, modelType in
          if error != nil {
              print(error?.localizedDescription as Any)
          } else {
              model?.configure(threshold: threshold, overlap: overlap, maxObjects: maxObjects)
            self.model = model
          }
        loading = false
      }
  }
  
  private static func parseDetections(detections: [Detection]) -> [[String: Any]] {
    var res = [[String: Any]]()
    for det in detections {
      res.append(det.vals())
    }
    return res
  }

  @objc
  public static func callback(_ frame: Frame!, withArgs _: [Any]!) -> Any! {
    let buffer = CMSampleBufferGetImageBuffer(frame.buffer)
    let ciimage = CIImage(cvPixelBuffer: buffer!)
    let context = CIContext(options: nil)
    let cgImage = context.createCGImage(ciimage, from: ciimage.extent)!
    let image = UIImage(cgImage: cgImage)
    let orientation = frame.orientation
    if self.model != nil {
      model?.detect(image: image) { detections, error in
          if error != nil {
              print(error)
          } else if let detections = detections {
            print("New Detections: \(detections.count)")
            detectionsBuffer.append(detections)
          }
      }
        //return detections
    } else if (!loading) {
      loadRoboflowModelWith(model: "YOUR-MODEL-NAME", version: 7/*insert your model version here*/, threshold: 0.5, overlap: 0.5, maxObjects: 20.0)
    }
    
    if detectionsBuffer.count > 0 {
      let toReturn = detectionsBuffer[0]
      detectionsBuffer.remove(at: 0)
      return parseDetections(detections:toReturn)
    }
    //
    // code goes here
    return []
  }
}
