# Project Overview: Site Map Editor (敷地図PDFエディタ)

## Purpose
A single-page web application for architectural site planning in Japan. It allows users to place buildings on a site map with constraints based on Japanese building regulations.

## Key Features
- PDF background loading for site maps
- 4 building types (2 residential, senior housing, apartments)
- 3 placement modes (select, place, area)
- 910mm grid system (Japanese architectural standard)
- Automatic placement constraints
- JSON data export

## Technical Details
- Scale: 1/1000 (1m = 4 pixels)
- Canvas: 1200×850 pixels (300m×212.5m)
- Grid: 910mm units (3.64 pixels)
- Building placement: Vertical orientation (long side vertical)
- Spacing: Adjustable 0-5m (default 1.2m)

## Building Types
1. PLAN-① (Building A): 6.37m × 8.19m residential
2. PLAN-② (Building B): 5.46m × 7.28m residential  
3. Building C: 42m × 43m service-oriented senior housing
4. Building D: 19.5m × 34.2m apartment

All buildings have entrance markers (red lines) on the short side.