# Translating Biomedical Knowledge Graphs

A web application for exploring biological pathways and relationships between biomedical entities using the NIH NCATS Translator knowledge graph system.

## About

Translator Pathfinder provides an interactive interface to visualize and explore connections between biological entities like genes, proteins, drugs, diseases, and phenotypes. The application leverages the [Translator ARS (Autonomous Relay System)](https://ars.ci.transltr.io) to query biomedical knowledge graphs and present the results as an interactive network visualization.

### Key Features

- **Interactive Network Visualization**: D3.js-powered graph visualization of biological pathways
- **Expandable Node Network**: Click on nodes to explore connected entities
- **Multi-Category Support**: Handles genes, proteins, drugs, diseases, phenotypes, and more
- **Real-time Queries**: Direct integration with Translator ARS API
- **Responsive Design**: Clean, modern interface built with Tailwind CSS

## Quick Start

### Prerequisites

- Node.js (version 14 or higher)
- npm (comes with Node.js)
- Modern web browser

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/translator-pathfinder.git
   cd translator-pathfinder
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the backend server**
   ```bash
   npm start
   ```
   The server will start on `http://localhost:3000`

4. **Open the frontend**
   - Open `index.html` in your web browser, or
   - Navigate to the file in your browser: `file:///path/to/translator-pathfinder/index.html`

## Project Structure

```
translator-pathfinder/
├── backend.js          # Express server and API endpoints
├── app.js             # Frontend JavaScript (D3.js visualization)
├── index.html         # Main HTML page
├── style.css          # Custom styles
├── package.json       # Node.js dependencies and scripts
├── README.md          # This file
└── .gitignore         # Git ignore rules
```

## Configuration

### Backend Configuration (backend.js)

The backend server can be configured by modifying these constants:

```javascript
const port = 3000;  // Server port
const ARS_CI_URL = "https://ars.ci.transltr.io";  // Translator ARS endpoint
const PRE_RUN_PK = "afb7349f-3422-4f22-bbd8-ad02667ca00d";  // Pre-run query ID
```

### Frontend Configuration (app.js)

Default query parameters can be modified:

```javascript
let QUERY_START_NODE = "NCBIGene:283635";  // FAM177A1
let QUERY_END_NODE = "NCBIGene:4790";      // NFKB1
let queryTitle = "FAM177A1 → NFKB1";
```

## API Endpoints

### GET /api/query

Fetches and processes biological pathway data from the Translator ARS system.

**Response Format:**
```json
{
  "nodes": [
    {
      "id": "NCBIGene:283635",
      "name": "FAM177A1",
      "categories": ["biolink:Gene"],
      "attributes": {...}
    }
  ],
  "edges": [
    {
      "id": "edge_1",
      "subject": "NCBIGene:283635",
      "object": "NCBIGene:4790",
      "predicate": "biolink:related_to",
      "attributes": {...}
    }
  ]
}
```

## Usage

1. **Starting the Application**: Launch the backend server and open the frontend
2. **Initial Query**: The app loads with a pre-configured pathway query (FAM177A1 → NFKB1)
3. **Exploring Connections**: 
   - Click on nodes to expand their connections
   - Hover over nodes and edges to see detailed information
   - Use the force-directed layout to explore the network structure
4. **Navigation**: Pan and zoom the visualization to focus on areas of interest

## Biological Context

This application is particularly useful for:

- **Drug Discovery**: Finding connections between drugs and target genes
- **Disease Research**: Exploring pathways between genes and diseases
- **Biomarker Discovery**: Identifying relationships between phenotypes and molecular entities
- **Pathway Analysis**: Understanding biological processes and their components

## Technical Details

### Frontend Technologies
- **D3.js v7**: Interactive data visualization
- **Tailwind CSS**: Utility-first CSS framework
- **Font Awesome**: Icon library
- **Google Fonts**: Lato and Poppins fonts

### Backend Technologies
- **Express.js**: Web server framework
- **Axios**: HTTP client for API requests
- **CORS**: Cross-origin resource sharing middleware

### Data Source
- **Translator ARS**: NIH NCATS Autonomous Relay System
- **Knowledge Graphs**: Multiple biomedical knowledge sources integrated through Translator

## Development

### Adding New Features

1. **Backend API**: Extend `backend.js` to add new endpoints
2. **Frontend Visualization**: Modify `app.js` to enhance the D3.js visualization
3. **Styling**: Update `style.css` or use Tailwind classes in `index.html`

### Debugging

- **Backend Logs**: Check the terminal where `node backend.js` is running
- **Frontend Logs**: Open browser developer tools (F12) and check the console
- **Network Issues**: Verify the backend server is running on port 3000

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

##  Acknowledgments

- **NIH NCATS Translator Program**: For providing the knowledge graph infrastructure
- **D3.js Community**: For the powerful data visualization library
- **Biomedical Ontologies**: NCBI Gene, MONDO, ChEBI, and other standardized vocabularies

[
