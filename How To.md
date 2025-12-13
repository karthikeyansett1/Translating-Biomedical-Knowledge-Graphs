Translator Pathfinder — How To Use
Overview

Translator Pathfinder is an interactive web application that allows biomedical researchers to explore relationships between genes, diseases, drugs, and biological processes using the NIH NCATS Translator knowledge graph.

This document explains how to set up, run, and use the application.

1. Setup Instructions
Requirements

Node.js (version 14 or higher)

npm

A modern web browser (Chrome, Firefox, Edge)

Installation

Unzip the project folder.

Open a terminal in the project directory.

Install dependencies:

npm install

2. Running the Application
Start the backend server
npm start


The backend will run at:

http://localhost:3000

Open the frontend

Open the file below in your web browser:

index.html

3. Using the Interface
Main Components

The interface consists of three panels:

Left Panel — Graph Legend & Filters

Toggle biological categories (Gene, Disease, Drug, Pathway, etc.)

Filters update the visualization dynamically

Center Panel — Graph Visualization

Nodes represent biomedical entities

Colors indicate entity types

Click nodes to select them

Use “Expand Neighbors” to reveal connections

Drag nodes to reposition them

Zoom and pan to explore dense regions

Right Panel — Details Panel

Displays node or edge descriptions

Shows canonical identifiers

Lists provenance sources

Provides Expand / Collapse controls

4. Typical Workflow

Load the application

Observe the minimal starting graph

Select a node of interest

Expand neighbors to explore biological relationships

Use filters to reduce visual clutter

Inspect provenance and descriptions in the Details panel

5. Troubleshooting

Ensure the backend server is running before opening the frontend

Check browser console for errors

Verify Node.js version if the server fails to start

6. Code Repository

GitHub repository:
https://github.com/karthikeyansett1/Translating-Biomedical-Knowledge-Graphs

