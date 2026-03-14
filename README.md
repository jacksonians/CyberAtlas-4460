# CyberAtlas - CS4460 Final Project

## Overview

CyberAtlas is a single-page interactive dashboard we built to explore different aspects of cybersecurity data, and our main goal was to walk users through how cyberattacks behave in practice such as how quickly they can spread, which sectors tend to be targeted, and what kinds of defenses are typically effective.

We organized the project as a scrolling narrative, where each section introduces a different visualization or idea. You can either scroll normally or use the navigation rail on the right to jump between sections.

## Project Links

**First Place Winner:** https://youtu.be/StiV1Chu8Lc?t=2271

**Live Website:** https://jacksonians.github.io/CyberAtlas-4460/

**Screencast Video:** https://youtu.be/TKjWsgYeC3Y

### Our Code

All of the project logic, layout, and visualizations were built by us. The main pieces include:

- **`index.html`** – The overall structure of the page and the content for each section.

- **`script.js`** – Handles navigation and most of the visualizations, including:
  - the node-spread simulation (showing how an attack propagates),
  - the industry distribution charts,
  - the timeline/stacked area chart of attack types,
  - and the bipartite network between attack types and defense tools.

- **`styles.css`** – Styling for the full site.
- **`globevis.js`** – The 3D globe visualization for global cybersecurity metrics.
- **`globevis.css`** – Specific styling for the globe elements.
- **`MapVisual.js`** – The U.S. map combined with interactive pie charts for state-level cybercrime data.

- **`data/`** – All the datasets we used:
  - `breakout_time.csv` – Lateral movement timing reference.
  - `Cyber_Metrics_Per_Country.csv` – Country-level cybersecurity indices.
  - `Cybersecurity_Incidents_Database.csv` – Historical incident dataset.
  - `DefenseTypes_IndustryTargeted_TypeOfAttack.csv` – Relationships between attack types and defense strategies.
  - `US_Cyber_Crimes.csv` – U.S. cybercrime statistics by state.

- **`images/`** – Team headshots.

### External Libraries

We relied on several external libraries (all loaded via CDN):

- **D3.js v7** – Used throughout for charts and general data visualization.
- **TopoJSON v2** – Geographic data processing for the map and globe.
- **D3-geo v1** – Geographic projection utilities for the globe.
- **GSAP 3.12.2** – Animation library for the scroll-based movement and transitions.
- **ScrollTrigger 3.12.2** – GSAP plugin to coordinate animations with scrolling.
- **Google Fonts** – Archivo, IBM Plex Mono, Inter.

## Team

- Dmitri Morris
- Heeba Merchant
- Jackson Li
- Tony Nguyen
