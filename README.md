# OpenSeadragon Performance Issue Demonstration

This repository is made for demonstration purposes, specifically showing how OpenSeadragon viewer performance and interaction issues occur when overlays containing OSD buttons are removed from the DOM.

## Purpose

This project demonstrates a specific issue with OpenSeadragon (OSD) where:

1. The viewer starts lagging significantly on tablets/mobile devices (not on desktop/Mac) when overlays containing OSD buttons created with `openSeaDragon.Button` are removed
2. The lag appears to be related to the OpenSeadragon MouseTracker events.
3. Custom buttons resolve the lag issue but introduce another problem: they don't properly handle mouse clicks on desktop when using Chromium-based browsers (clicks pass through to the canvas)
4. Custom buttons work correctly on Firefox PC but fail on Chromium-based browsers

The demo uses a React + TypeScript application to clearly illustrate these cross-platform interaction problems.

## Features

- OpenSeadragon integration with React
- Demonstration of button functionality issues in overlays
- Reproducible test case for the OpenSeadragon button bug
- Custom control buttons implementation
- Responsive UI with Tailwind CSS
