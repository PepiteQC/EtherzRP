'use client';

import React from 'react';
import RayMarchingKinect from '../components/kinect/RayMarchingKinect';

export default function KinectPage() {
  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
      <RayMarchingKinect />
      
      {/* Subtle top bar (matches the clean minimalistic design described) */}
      <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-black/60 to-transparent pointer-events-none z-40" />
      
      <div className="absolute bottom-4 right-4 text-[10px] text-white/40 font-mono tracking-[2px] z-50 pointer-events-none">
        REACT THREE FIBER • RAY MARCHING • KINECT DEPTH
      </div>
    </div>
  );
}
