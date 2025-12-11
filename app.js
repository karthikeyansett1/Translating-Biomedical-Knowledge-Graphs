// === GLOBAL DATA STORE ===
let nodes = [];
let links = [];
let allNodes = new Map();
let allEdges = new Map();
let allResults = [];
let expandedNodes = new Map(); // Tracks which nodes have been expanded

// === D3 GLOBALS ===
let simulation, svg, g, linkElements, nodeElements;

// === CONFIGURATION ===
let QUERY_START_NODE = "NCBIGene:283635"; // FAM177A1
let QUERY_END_NODE = "NCBIGene:4790";    // NFKB1
let queryTitle = "FAM177A1 → NFKB1";

// === HELPER: Label Prioritization ===
function getPriorityCategory(categories) {
    if (!categories || categories.length === 0) return 'NamedThing';
    const cats = new Set(categories.map(c => c.replace('biolink:', '')));
    
    if (cats.has('Drug')) return 'Drug';
    if (cats.has('ChemicalEntity')) return 'ChemicalEntity';
    if (cats.has('SmallMolecule')) return 'SmallMolecule'; // Distinct from Chemical
    if (cats.has('Protein')) return 'Gene'; 
    if (cats.has('Gene')) return 'Gene';
    if (cats.has('Disease')) return 'Disease';
    if (cats.has('PhenotypicFeature')) return 'PhenotypicFeature';
    if (cats.has('BiologicalProcess')) return 'BiologicalProcess';
    if (cats.has('Pathway')) return 'Pathway';
    
    return Array.from(cats)[0]; 
}

// === COLOR SCALE ===
window.GLOBAL_COLOR_SCALE = d3.scaleOrdinal()
    .domain(['Disease', 'Drug', 'ChemicalEntity', 'SmallMolecule', 'Gene', 'PhenotypicFeature', 'BiologicalProcess', 'Pathway', 'NamedThing'])
    .range([
        '#ef4444', // Disease (Red)
        '#8b5cf6', // Drug (Purple)
        '#3b82f6', // ChemicalEntity (Blue)
        '#06b6d4', // SmallMolecule (Cyan)
        '#22c55e', // Gene (Green)
        '#eab308', // Phenotype (Yellow)
        '#f97316', // BioProcess (Orange)
        '#ec4899', // Pathway (Pink)
        '#94a3b8'  // Default (Gray)
    ]);

// === INITIALIZATION ===
document.addEventListener('DOMContentLoaded', () => {
    if (typeof d3 === 'undefined') {
        alert("D3.js failed to load. Please refresh.");
        return;
    }
    
    // Start button handler
    const startBtn = document.getElementById('start-btn');
    if(startBtn) startBtn.addEventListener('click', startApp);
    
    window.addEventListener('resize', () => {
        if(simulation) simulation.alpha(0.3).restart();
    });
});

// === APP FLOW ===
async function startApp() {
    // 1. UI Updates
    document.getElementById('landing-page').style.display = 'none';
    document.getElementById('loading-overlay').style.display = 'flex';
    
    // 2. Fetch Data
    try {
        const response = await fetch('http://localhost:3000/api/query');
        const data = await response.json();
        
        if (!data.message) throw new Error("Invalid data format");

        // 3. Process Data
        const kg = data.message.knowledge_graph;
        Object.entries(kg.nodes).forEach(([id, n]) => allNodes.set(id, n));
        Object.entries(kg.edges).forEach(([id, e]) => allEdges.set(id, e));
        allResults = data.message.results || [];
        
        findQueryNodeIDs(data.message.query_graph);

        // 4. Reveal Graph Container FIRST (Critical for D3 sizing)
        document.getElementById('loading-overlay').style.display = 'none';
        document.getElementById('app-container').style.display = 'grid';
        document.getElementById('query-title').innerText = queryTitle;

        // 5. Initialize D3 & Build Graph
        setupSimulation();
        buildInitialGraph();
        
        // 6. Render
        updateGraph();
        updateFilterPanel();
        showDetails(QUERY_START_NODE);

    } catch (e) {
        console.error(e);
        alert("Error loading data: " + e.message);
    }
}

function findQueryNodeIDs(queryGraph) {
    if (!queryGraph) return;
    const ids = Object.values(queryGraph.nodes).filter(n => n.ids).map(n => n.ids[0]);
    if (ids.length >= 2) {
        if(allNodes.has(ids[0])) QUERY_START_NODE = ids[0];
        if(allNodes.has(ids[1])) QUERY_END_NODE = ids[1];
    }
    const sName = allNodes.get(QUERY_START_NODE)?.name || QUERY_START_NODE;
    const eName = allNodes.get(QUERY_END_NODE)?.name || QUERY_END_NODE;
    queryTitle = `${sName} → ${eName}`;
}

// === GRAPH BUILDERS ===

function buildInitialGraph() {
    nodes = [];
    links = [];
    
    [QUERY_START_NODE, QUERY_END_NODE].forEach((id, index) => {
        const nodeData = allNodes.get(id);
        if (!nodeData) return;

        const category = getPriorityCategory(nodeData.categories);
        const canvas = document.getElementById('graph-canvas');
        
        // Use client dimensions or fallbacks
        const width = canvas ? canvas.clientWidth : 800;
        const height = canvas ? canvas.clientHeight : 600;

        // Valid Initial Positions
        const initialX = width * (index === 0 ? 0.2 : 0.8);
        const initialY = height * 0.5;

        nodes.push({
            id: id,
            name: nodeData.name || id,
            category: category,
            radius: 35, 
            fx: initialX, // Fixed X
            fy: initialY, // Fixed Y
            x: initialX,  // Initial X (prevents NaN)
            y: initialY   // Initial Y (prevents NaN)
        });
    });
}

function expandNode(nodeId) {
    const parentNode = nodes.find(n => n.id === nodeId);
    if (!parentNode) return;

    if (expandedNodes.has(nodeId)) {
        collapseNode(nodeId);
        return;
    }

    console.log(`Expanding ${nodeId}...`);
    const addedNodeIds = new Set();
    
    allEdges.forEach((edge, edgeId) => {
        if (edge.subject === nodeId || edge.object === nodeId) {
            const neighborId = edge.subject === nodeId ? edge.object : edge.subject;
            
            if (nodes.find(n => n.id === neighborId)) return;
            
            if (addedNodeIds.size > 20) return;

            const nData = allNodes.get(neighborId);
            if (!nData) return;

            // Initialize new node near parent to avoid NaN/jumps
            const startX = parentNode.x || parentNode.fx || 400;
            const startY = parentNode.y || parentNode.fy || 300;

            nodes.push({
                id: neighborId,
                name: nData.name || neighborId,
                category: getPriorityCategory(nData.categories),
                radius: 12,
                x: startX + (Math.random() - 0.5) * 50,
                y: startY + (Math.random() - 0.5) * 50,
                parentNodeId: nodeId 
            });
            addedNodeIds.add(neighborId);
        }
    });

    recalculateLinks();

    expandedNodes.set(nodeId, true);
    updateGraph();
    showDetails(nodeId); 
}

function collapseNode(nodeId) {
    console.log(`Collapsing ${nodeId}...`);
    nodes = nodes.filter(n => n.parentNodeId !== nodeId);
    recalculateLinks();
    expandedNodes.delete(nodeId);
    updateGraph();
    showDetails(nodeId);
}

function recalculateLinks() {
    links = [];
    const visibleIds = new Set(nodes.map(n => n.id));
    
    allEdges.forEach((edge, edgeId) => {
        if (visibleIds.has(edge.subject) && visibleIds.has(edge.object)) {
            if (!links.find(l => l.id === edgeId)) {
                links.push({
                    id: edgeId, 
                    source: edge.subject,
                    target: edge.object
                });
            }
        }
    });
}

// === D3 VISUALIZATION ===
function setupSimulation() {
    const canvas = document.getElementById('graph-canvas');
    if (!canvas) return;
    
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    
    canvas.innerHTML = ''; 
    svg = d3.select("#graph-canvas").append("svg")
        .attr("width", "100%").attr("height", "100%")
        .call(d3.zoom().on("zoom", e => g.attr("transform", e.transform)))
        .on("dblclick.zoom", null);
        
    g = svg.append("g");
    
    svg.append("defs").append("marker")
        .attr("id", "arrow")
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 25).attr("refY", 0)
        .attr("markerWidth", 6).attr("markerHeight", 6)
        .attr("orient", "auto")
        .append("path").attr("d", "M0,-5L10,0L0,5").attr("fill", "#cbd5e1");

    linkElements = g.append("g").attr("class", "links").selectAll(".link");
    nodeElements = g.append("g").attr("class", "nodes").selectAll(".node");

    simulation = d3.forceSimulation()
        .force("link", d3.forceLink().id(d => d.id).distance(150)) 
        .force("charge", d3.forceManyBody().strength(-800)) 
        .force("collide", d3.forceCollide().radius(50).iterations(2)) 
        .force("center", d3.forceCenter(width / 2, height / 2))
        .alphaDecay(0.05) 
        .on("tick", ticked);
}

function updateGraph() {
    const visibleCats = new Set();
    document.querySelectorAll('#filter-panel input:checked').forEach(c => visibleCats.add(c.value));
    
    const d3Nodes = nodes.filter(n => visibleCats.has(n.category) || n.id === QUERY_START_NODE || n.id === QUERY_END_NODE);
    const d3NodeIds = new Set(d3Nodes.map(n => n.id));
    const d3Links = links.filter(l => d3NodeIds.has(l.source.id || l.source) && d3NodeIds.has(l.target.id || l.target));

    nodeElements = nodeElements.data(d3Nodes, d => d.id).join(
        enter => {
            const grp = enter.append("g").attr("class", "node")
                .call(d3.drag().on("start", dragstarted).on("drag", dragged).on("end", dragended))
                .on("click", (e, d) => showDetails(d.id));
                
            grp.append("circle")
                .attr("r", d => d.radius)
                .attr("fill", d => window.GLOBAL_COLOR_SCALE(d.category))
                .attr("stroke", "#fff").attr("stroke-width", 2);
                
            grp.append("text")
                .text(d => d.name)
                .attr("x", d => d.radius + 5).attr("y", 5)
                .style("font-size", "12px").style("fill", "#334155")
                .style("pointer-events", "none");
                
            return grp;
        },
        update => update,
        exit => exit.remove()
    );

    linkElements = linkElements.data(d3Links, d => d.id).join(
        enter => enter.append("path")
            .attr("class", "link")
            .attr("stroke", "#cbd5e1").attr("stroke-width", 2).attr("fill", "none")
            // .attr("marker-end", "url(#arrow)") 
            .on("click", (e, d) => showDetails(d.id, 'edge')),
        update => update,
        exit => exit.remove()
    );

    simulation.nodes(d3Nodes);
    simulation.force("link").links(d3Links);
    simulation.alpha(1).restart();
}

function ticked() {
    // --- SAFETY CHECK FOR NaN ---
    if (!linkElements || !nodeElements) return;

    linkElements.attr("d", d => {
        // Only update if coords are valid numbers
        if (isNaN(d.source.x) || isNaN(d.source.y) || isNaN(d.target.x) || isNaN(d.target.y)) return "";
        return `M${d.source.x},${d.source.y}L${d.target.x},${d.target.y}`;
    });
    
    nodeElements.attr("transform", d => {
        // Only update if coords are valid numbers
        if (isNaN(d.x) || isNaN(d.y)) return "";
        return `translate(${d.x},${d.y})`;
    });
}

function dragstarted(e, d) { if (!e.active) simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; }
function dragged(e, d) { d.fx = e.x; d.fy = e.y; }
function dragended(e, d) { if (!e.active) simulation.alphaTarget(0); if(d.id !== QUERY_START_NODE && d.id !== QUERY_END_NODE) {d.fx = null; d.fy = null;} }

// === DETAILS & SIDEBAR ===
function showDetails(id, type = 'node') {
    const panel = document.getElementById('details-panel');
    
    if (type === 'node') {
        const node = allNodes.get(id);
        if (!node) return;

        const category = getPriorityCategory(node.categories);
        const color = window.GLOBAL_COLOR_SCALE(category);
        const description = (node.attributes || []).find(a => a.attribute_type_id === 'biolink:description')?.value || 'No description.';
        
        let sourcesList = "";
        allEdges.forEach(e => {
            if(e.subject === id || e.object === id) {
                (e.sources || []).forEach(s => {
                    const src = s.resource_id.replace('infores:', '');
                    const isPrimary = s.resource_role === 'primary_knowledge_source';
                    const style = isPrimary ? 'color:#2563eb; font-weight:bold;' : 'color:#64748b;';
                    sourcesList += `<li style="${style}">${src} ${isPrimary ? '(Primary)' : ''}</li>`;
                });
            }
        });

        const isExpanded = expandedNodes.has(id);
        const btnText = isExpanded ? "Collapse Neighbors" : "Expand Neighbors";
        const btnColor = isExpanded ? "bg-red-500 hover:bg-red-600" : "bg-blue-600 hover:bg-blue-700";

        panel.innerHTML = `
            <div class="detail-block">
                <h4 class="detail-name">${node.name}</h4>
                <div class="detail-id">${id}</div>
                <span class="detail-category-badge" style="background:${color}20; color:${color}; border:1px solid ${color}">${category}</span>
                <button onclick="expandNode('${id}')" class="w-full mt-4 ${btnColor} text-white py-2 rounded transition font-semibold text-sm">
                    ${btnText}
                </button>
            </div>
            <div class="detail-block">
                <h5 class="detail-title">Description</h5>
                <p class="text-sm text-gray-600">${description}</p>
            </div>
            <div class="detail-block">
                <h5 class="detail-title">All Sources</h5>
                <ul class="detail-list">${sourcesList}</ul>
            </div>
        `;
    } else {
        const edge = allEdges.get(id);
        const subject = allNodes.get(edge.subject).name;
        const object = allNodes.get(edge.object).name;
        const pred = (edge.predicates?.[0] || 'related').replace('biolink:', '');
        
        let sourcesList = "";
        (edge.sources || []).forEach(s => {
            const src = s.resource_id.replace('infores:', '');
            const isPrimary = s.resource_role === 'primary_knowledge_source';
            const style = isPrimary ? 'color:#2563eb; font-weight:bold;' : 'color:#64748b;';
            sourcesList += `<li style="${style}">${src} ${isPrimary ? '(Primary)' : ''}</li>`;
        });

        panel.innerHTML = `
            <div class="detail-block">
                <h5 class="detail-title">Relationship</h5>
                <div class="text-lg font-bold text-gray-800">${subject}</div>
                <div class="text-blue-600 font-mono text-sm my-1">-- ${pred} --></div>
                <div class="text-lg font-bold text-gray-800">${object}</div>
            </div>
            <div class="detail-block">
                <h5 class="detail-title">Sources</h5>
                <ul class="detail-list">${sourcesList}</ul>
            </div>
        `;
    }
}

function updateFilterPanel() {
    const panel = document.getElementById('filter-panel');
    panel.innerHTML = "";
    
    const cats = new Set();
    allNodes.forEach(n => cats.add(getPriorityCategory(n.categories)));

    Array.from(cats).sort().forEach(c => {
         const color = window.GLOBAL_COLOR_SCALE(c);
         panel.innerHTML += `
            <label class="filter-label">
                <input type="checkbox" value="${c}" checked onchange="updateGraph()">
                <span class="color-swatch" style="background:${color}"></span>
                <span class="text-sm font-medium ml-2">${c}</span>
            </label>
         `;
    });
}