import React from 'react';
import { Composition } from 'remotion';
import { ChapterRenderPayload, StudioVideo } from './StudioVideo';

const DEFAULT_PAYLOAD: ChapterRenderPayload = {
  fps: 30,
  chapterIndex: 1,
  totalChapters: 1,
  chapterTitle: '章节预览',
  chapterStartOffsetSec: 0,
  chapterDurationSec: 5,
  globalTotalDurationSec: 5,
  audioFile: '',
  scenes: [],
  captions: [],
};

export const StudioRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Studio16x9"
        component={StudioVideo}
        fps={30}
        width={1920}
        height={1080}
        durationInFrames={150}
        defaultProps={{
          payload: DEFAULT_PAYLOAD,
          aspect: '16x9' as const,
        }}
        calculateMetadata={({ props }) => {
          const fps = props.payload.fps || 30;
          const frames = Math.max(30, Math.round((props.payload.chapterDurationSec || 5) * fps));
          return { durationInFrames: frames, fps, width: 1920, height: 1080 };
        }}
      />
      <Composition
        id="Studio9x16"
        component={StudioVideo}
        fps={30}
        width={1080}
        height={1920}
        durationInFrames={150}
        defaultProps={{
          payload: DEFAULT_PAYLOAD,
          aspect: '9x16' as const,
        }}
        calculateMetadata={({ props }) => {
          const fps = props.payload.fps || 30;
          const frames = Math.max(30, Math.round((props.payload.chapterDurationSec || 5) * fps));
          return { durationInFrames: frames, fps, width: 1080, height: 1920 };
        }}
      />
    </>
  );
};
