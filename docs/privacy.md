# Privacy

Physical Kanban Sync ships with no analytics.

## Local Data

Board data is stored in the browser with IndexedDB. JSON exports are created only when the user presses Export.

## Camera

Camera frames are processed in the browser. Frames are converted to grayscale and sent to a local Web Worker for AprilTag detection. Frames are not uploaded by the app.

## WebRTC Sync

When Room Sync is enabled, board state is shared with peers in the same room through Yjs/WebRTC. Public signaling servers help peers discover each other, but v1 has no project-owned relay or durable cloud database.

## Local LLM

The Assist button lazy-loads WebLLM and downloads model assets in the browser. Prompts are generated from the current board text and run locally with WebGPU when supported.

## External URLs

Live app: https://baditaflorin.github.io/physical-kanban-sync/

Repository: https://github.com/baditaflorin/physical-kanban-sync

Support: https://www.paypal.com/paypalme/florinbadita
