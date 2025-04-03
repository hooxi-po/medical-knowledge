// Global variables
let allProfessionals = []; // Store all loaded professionals (maybe up to 100 initially)
let currentGraphData = { nodes: [], links: [] }; // Data currently shown in the graph
let d3Objects = { // Store D3 elements/simulation
    svg: null,
    simulation: null,
    zoom: null,
    link: null,
    node: null,
    graphGroup: null
};
let currentCenterNodeId = null; // ID of the professional currently focused in the graph

// DOM Elements (initialized in DOMContentLoaded)
let dom = {};

document.addEventListener('DOMContentLoaded', () => {
    // Initialize DOM element references
    dom.searchInput = document.getElementById('search-input');
    dom.searchButton = document.getElementById('search-button');
    dom.professionalsList = document.getElementById('professionals-list');
    dom.professionalDetailsModal = document.getElementById('professional-details');
    dom.detailsContent = document.getElementById('details-content');
    dom.analysisContent = document.getElementById('analysis-content');
    dom.recommendationsContent = document.getElementById('recommendations-content');
    dom.closeModalButton = document.querySelector('.modal .close');
    dom.questionInput = document.getElementById('question-input');
    dom.sendQuestionButton = document.getElementById('send-question');
    dom.chatMessages = document.getElementById('chat-messages');
    dom.networkGraphContainer = document.getElementById('network-graph-container');
    dom.networkGraph = document.getElementById('network-graph');
    dom.graphControls = {
        zoomIn: document.getElementById('zoom-in'),
        zoomOut: document.getElementById('zoom-out'),
        reset: document.getElementById('reset-graph')
    };
    dom.graphContextTitle = document.getElementById('graph-context-title');
    // dom.loadMoreBtn = document.getElementById('load-more-btn'); // If using load more

    // --- Initial Setup ---
    showGraphPlaceholder("请从左侧列表选择一位专业人员查看其关系网络。"); // Initial placeholder
    loadInitialProfessionals(); // Load initial batch of professionals
    setupEventListeners(); // Setup all event listeners
});

function setupEventListeners() {
    // Search
    dom.searchButton.addEventListener('click', handleSearch);
    dom.searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });

    // Modal close
    dom.closeModalButton.addEventListener('click', () => dom.professionalDetailsModal.style.display = 'none');
    window.addEventListener('click', (event) => {
        if (event.target === dom.professionalDetailsModal) {
            dom.professionalDetailsModal.style.display = 'none';
        }
    });

    // AI Chat
    dom.sendQuestionButton.addEventListener('click', sendQuestionToAI);
    dom.questionInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendQuestionToAI();
        }
    });

    // Graph Controls
    dom.graphControls.zoomIn.addEventListener('click', () => d3Objects.zoom?.scaleBy(d3Objects.svg.transition().duration(300), 1.3));
    dom.graphControls.zoomOut.addEventListener('click', () => d3Objects.zoom?.scaleBy(d3Objects.svg.transition().duration(300), 1 / 1.3));
    dom.graphControls.reset.addEventListener('click', () => d3Objects.zoom?.transform(d3Objects.svg.transition().duration(500), d3.zoomIdentity));

     // Load More Button (Example - uncomment if needed)
    /*
    dom.loadMoreBtn.addEventListener('click', async () => {
        const currentCount = allProfessionals.length;
        dom.loadMoreBtn.textContent = '加载中...';
        dom.loadMoreBtn.disabled = true;
        try {
            const moreProfessionals = await fetchProfessionals(50, currentCount); // Fetch next 50
            if (moreProfessionals.length > 0) {
                allProfessionals = allProfessionals.concat(moreProfessionals);
                renderProfessionalsList(allProfessionals); // Re-render the full list
                dom.loadMoreBtn.textContent = '加载更多';
                dom.loadMoreBtn.disabled = false;
            } else {
                dom.loadMoreBtn.textContent = '已加载全部';
                dom.loadMoreBtn.style.display = 'none'; // Hide if no more data
            }
        } catch (error) {
            console.error("Failed to load more professionals:", error);
            dom.loadMoreBtn.textContent = '加载失败，请重试';
            dom.loadMoreBtn.disabled = false;
        }
    });
    */
}

// --- Data Loading and Rendering ---

async function loadInitialProfessionals() {
    renderProfessionalsList([]); // Clear list initially
    showLoadingIndicator(dom.professionalsList, "加载专业人员列表中...");
    // dom.loadMoreBtn.style.display = 'none'; // Hide load more initially

    const initialLimit = 100; // Load first 100 professionals
    try {
        allProfessionals = await fetchProfessionals(initialLimit, 0);
        console.log(`Loaded initial ${allProfessionals.length} professionals.`);
        renderProfessionalsList(allProfessionals); // Render the initial list

        // Show load more button if we received the full limit, suggesting more exist
        // if (allProfessionals.length === initialLimit && dom.loadMoreBtn) {
        //     dom.loadMoreBtn.style.display = 'block';
        //     dom.loadMoreBtn.disabled = false;
        //     dom.loadMoreBtn.textContent = '加载更多';
        // }

    } catch (error) {
        console.error("Failed to load initial professionals:", error);
        showErrorIndicator(dom.professionalsList, "加载列表失败，请稍后重试。");
    }
}

function handleSearch() {
    const query = dom.searchInput.value.trim();
    clearGraph("搜索中..."); // Clear graph when search starts
    if (query) {
        searchAndRenderProfessionals(query);
    } else {
        // If search is cleared, show the initially loaded list
        renderProfessionalsList(allProfessionals);
    }
}

async function searchAndRenderProfessionals(query) {
    showLoadingIndicator(dom.professionalsList, `正在搜索 "${query}"...`);
    try {
        // Search API might still use its default limit (e.g., 20) which is fine for search results
        const results = await searchProfessionals(query);
        console.log(`Search found ${results.length} results for query: "${query}"`);
        renderProfessionalsList(results, true); // Render results, indicate it's search results
    } catch (error) {
        console.error("Search failed:", error);
        showErrorIndicator(dom.professionalsList, "搜索失败，请稍后重试。");
    }
}

function renderProfessionalsList(professionalsData, isSearchResult = false) {
    dom.professionalsList.innerHTML = ''; // Clear previous items

    if (!professionalsData || professionalsData.length === 0) {
        showInfoIndicator(dom.professionalsList, isSearchResult ? "未找到匹配的专业人员。" : "列表为空。");
        return;
    }

    professionalsData.forEach(prof => {
        const card = document.createElement('div');
        card.className = 'card';
        card.setAttribute('data-id', prof._id); // Store ID for easy access

        const name = prof.personal_info?.name || '未知姓名';
        const title = prof.professional_info?.title || '未知职称';
        const affiliation = prof.professional_info?.affiliation || '未知机构';

        card.innerHTML = `
            <h3>${name}</h3>
            <p><strong>职称:</strong> ${title}</p>
            <p><strong>机构:</strong> ${affiliation}</p>
        `;

        // Click listener for both modal and graph update
        card.addEventListener('click', () => {
            handleProfessionalSelect(prof._id);
             // Optional: Highlight selected card
            document.querySelectorAll('.card').forEach(c => c.style.borderColor = '#e8e8e8');
            card.style.borderColor = '#3498db'; // Highlight clicked card
        });

        dom.professionalsList.appendChild(card);
    });
}

function handleProfessionalSelect(professionalId) {
     // Find the full professional data from the loaded list
    const selectedProf = allProfessionals.find(p => p._id === professionalId);
    if (!selectedProf) {
        console.warn("Selected professional data not found in the loaded list. ID:", professionalId);
        // Optionally: Fetch details specifically if not found, though it shouldn't happen with this flow
        showProfessionalDetails(professionalId); // Still try to show modal
        clearGraph(`无法生成网络图：未找到ID ${professionalId} 的数据`);
        return;
    }

    console.log("Selected Professional:", selectedProf.personal_info?.name);
    showProfessionalDetails(professionalId); // Show details in modal
    updateVisualization(selectedProf); // Update graph with context
}


// --- Modal ---

async function showProfessionalDetails(id) {
    dom.professionalDetailsModal.style.display = 'block';
    // Reset content areas
    dom.detailsContent.innerHTML = '<div class="loading">加载详情中...</div>';
    dom.analysisContent.innerHTML = '<div class="loading">AI分析中...</div>';
    dom.recommendationsContent.innerHTML = '<div class="loading">获取推荐中...</div>';

    try {
        // Fetch details, analysis, and recommendations
        const professional = await fetchProfessionalDetails(id);
        if (!professional) throw new Error("Professional not found");
        renderProfessionalDetails(professional); // Render main details

        // Fetch AI parts concurrently
        const [analysisRes, recommendationsRes] = await Promise.allSettled([
            fetchProfessionalAnalysis(id),
            fetchRecommendations(id) // Backend logic for recommendations might need review
        ]);

        // Update analysis section
        if (analysisRes.status === 'fulfilled' && analysisRes.value.analysis) {
            dom.analysisContent.innerHTML = formatText(analysisRes.value.analysis);
        } else {
            dom.analysisContent.innerHTML = '<div class="error">无法获取AI分析结果</div>';
            console.error("Analysis fetch error:", analysisRes.reason || "No analysis content");
        }

        // Update recommendations section
        if (recommendationsRes.status === 'fulfilled' && recommendationsRes.value.recommendations) {
            dom.recommendationsContent.innerHTML = formatText(recommendationsRes.value.recommendations);
        } else {
            dom.recommendationsContent.innerHTML = '<div class="error">无法获取推荐结果</div>';
            console.error("Recommendations fetch error:", recommendationsRes.reason || "No recommendation content");
        }

    } catch (error) {
        console.error("Failed to show professional details:", error);
        dom.detailsContent.innerHTML = '<div class="error">加载详情失败</div>';
        dom.analysisContent.innerHTML = '';
        dom.recommendationsContent.innerHTML = '';
    }
}

function renderProfessionalDetails(professional) {
    // (This function remains largely the same as the previous version)
    const personalInfo = professional.personal_info || {};
    const professionalInfo = professional.professional_info || {};
    const academicInfo = professional.academic_info || {};

    const display = (value) => value || '未知';
    const displayList = (list) => Array.isArray(list) && list.length > 0 ? list.join(', ') : '未知';

    const html = `
        <h2>${display(personalInfo.name)}</h2>
        <div class="detail-section">
            <h3>个人信息</h3>
            <p><strong>性别:</strong> ${display(personalInfo.gender)}</p>
             <p><strong>出生日期:</strong> ${display(personalInfo.dob)}</p>
             <p><strong>民族:</strong> ${display(personalInfo.ethnicity)}</p>
            <p><strong>邮箱:</strong> ${display(personalInfo.email)}</p>
            <p><strong>电话:</strong> ${display(personalInfo.phone)}</p>
        </div>
        <div class="detail-section">
            <h3>专业信息</h3>
            <p><strong>职称:</strong> ${display(professionalInfo.title)}</p>
            <p><strong>所属机构:</strong> ${display(professionalInfo.affiliation)}</p>
             <p><strong>党派:</strong> ${display(professionalInfo.party)}</p>
             <p><strong>来源:</strong> ${display(professionalInfo.origin)}</p>
             <p><strong>社会职务:</strong> ${display(professionalInfo.society_role)}</p>
        </div>
        <div class="detail-section">
            <h3>学术信息</h3>
            <p><strong>研究兴趣:</strong> ${displayList(academicInfo.research_interests)}</p>
             <p><strong>履历:</strong> ${display(academicInfo.cv?.[0])}</p>
             <p><strong>成就:</strong> ${display(academicInfo.achievements?.[0])}</p>
        </div>`;
    dom.detailsContent.innerHTML = html;
}


// --- AI Assistant ---

async function sendQuestionToAI() {
    // (This function remains largely the same as the previous version)
    const question = dom.questionInput.value.trim();
    if (!question) return;
    addMessageToChat(question, 'user');
    dom.questionInput.value = '';
    dom.questionInput.focus();
    const loadingMsg = addMessageToChat('正在思考...', 'system loading');
    try {
        const response = await askQuestion(question);
        loadingMsg.innerHTML = formatText(response.answer);
        loadingMsg.classList.remove('loading');
    } catch (error) {
        console.error("AI question failed:", error);
        loadingMsg.innerHTML = formatText('抱歉，回答您的问题时遇到错误。');
        loadingMsg.classList.remove('loading');
        loadingMsg.classList.add('error');
    } finally {
        dom.chatMessages.scrollTop = dom.chatMessages.scrollHeight;
    }
}

function addMessageToChat(text, type) {
    // (This function remains largely the same as the previous version)
    const messageElement = document.createElement('div');
    messageElement.className = `message ${type}`;
    messageElement.innerHTML = formatText(text);
    dom.chatMessages.appendChild(messageElement);
    dom.chatMessages.scrollTop = dom.chatMessages.scrollHeight;
    return messageElement;
}

// --- Relationship Visualization ---

function showGraphPlaceholder(message) {
    dom.networkGraph.innerHTML = `<div class="graph-placeholder">${message}</div>`;
    dom.graphContextTitle.textContent = ''; // Clear context title
    // Disable controls when placeholder is shown
    Object.values(dom.graphControls).forEach(btn => btn.disabled = true);
     // Stop any previous simulation
    d3Objects.simulation?.stop();
    d3Objects.svg?.remove(); // Remove previous SVG
    d3Objects.svg = null;
    currentCenterNodeId = null;
}

function clearGraph(message = "正在清空图谱...") {
     showGraphPlaceholder(message); // Reuse placeholder function
}


function updateVisualization(centerProfessional) {
    currentCenterNodeId = centerProfessional._id;
    dom.graphContextTitle.textContent = `(${centerProfessional.personal_info?.name || '未知'} 的关系网络)`;
    console.log("Updating visualization for:", centerProfessional.personal_info?.name);
    showLoadingIndicator(dom.networkGraph, "生成关系图谱中..."); // Show loading in graph area

    // Prepare graph data based on the selected professional
    currentGraphData = prepareGraphData(centerProfessional);

    if (currentGraphData.nodes.length <= 1) { // Only the center node, no links/interests
         showGraphPlaceholder(`${centerProfessional.personal_info?.name || '该人员'} 没有共享研究兴趣或关联人员。`);
         console.log("No shared interests or connections found for graph.");
         return;
    }

     // Use setTimeout to allow the loading indicator to render before heavy D3 processing
    setTimeout(() => {
        try {
            initializeOrUpdateGraph();
            // Enable controls
            Object.values(dom.graphControls).forEach(btn => btn.disabled = false);
        } catch (error) {
            console.error("Error updating visualization:", error);
            showErrorIndicator(dom.networkGraph, "生成图谱时出错。");
             Object.values(dom.graphControls).forEach(btn => btn.disabled = true);
        }
    }, 50);
}


function prepareGraphData(centerProf) {
    const nodes = [];
    const links = [];
    const nodeIds = new Set(); // Keep track of nodes added

    // 1. Add the Center Professional Node
    nodes.push({
        id: centerProf._id,
        name: centerProf.personal_info?.name || '未知',
        type: 'professional',
        isCenter: true, // Mark the center node
        affiliation: centerProf.professional_info?.affiliation || '未知'
    });
    nodeIds.add(centerProf._id);

    const centerInterests = centerProf.academic_info?.research_interests || [];
    if (centerInterests.length === 0) {
        console.log("Center professional has no listed research interests.");
        return { nodes, links }; // Return only the center node if no interests
    }

    // 2. Add Interest Nodes connected to the Center Professional
    const interestNodesMap = new Map(); // Map interest name to node object
     centerInterests.forEach(interest => {
        const normalizedInterest = interest.trim();
        if (!normalizedInterest) return;
        const interestId = `interest-${normalizedInterest}`;

        if (!nodeIds.has(interestId)) {
             const interestNode = {
                id: interestId,
                name: normalizedInterest,
                type: 'interest',
                count: 0 // Initialize count
             };
             nodes.push(interestNode);
             interestNodesMap.set(normalizedInterest, interestNode);
             nodeIds.add(interestId);
        }
         // Link center node to this interest
        links.push({ source: centerProf._id, target: interestId, type: 'has-interest' });
         interestNodesMap.get(normalizedInterest).count++; // Increment count for center prof
    });


    // 3. Find Related Professionals and link them
    allProfessionals.forEach(otherProf => {
        if (otherProf._id === centerProf._id) return; // Skip self

        const otherInterests = otherProf.academic_info?.research_interests || [];
        let isRelated = false;
        let sharedInterests = [];

        otherInterests.forEach(otherInterest => {
            const normalizedOtherInterest = otherInterest.trim();
            if (!normalizedOtherInterest) return;

            // Check if this interest is one of the center node's interests
            if (interestNodesMap.has(normalizedOtherInterest)) {
                isRelated = true;
                sharedInterests.push(normalizedOtherInterest);
                 // Increment count on the interest node
                 interestNodesMap.get(normalizedOtherInterest).count++;
            }
        });

        // If related, add the professional node (if not already added) and links
        if (isRelated) {
            if (!nodeIds.has(otherProf._id)) {
                nodes.push({
                    id: otherProf._id,
                    name: otherProf.personal_info?.name || '未知',
                    type: 'professional',
                    isCenter: false,
                    affiliation: otherProf.professional_info?.affiliation || '未知'
                });
                nodeIds.add(otherProf._id);
            }

            // Add links from related professional to shared interests
            sharedInterests.forEach(sharedInterest => {
                 const interestId = `interest-${sharedInterest}`;
                 // Avoid duplicate links if somehow possible
                 const linkExists = links.some(l => (l.source === otherProf._id && l.target === interestId) || (l.source === interestId && l.target === otherProf._id));
                 if (!linkExists) {
                    links.push({ source: otherProf._id, target: interestId, type: 'has-interest' });
                 }
            });
        }
    });

    console.log(`Prepared graph data: ${nodes.length} nodes, ${links.length} links.`);
    return { nodes, links };
}


function initializeOrUpdateGraph() {
    if (!currentGraphData.nodes || currentGraphData.nodes.length === 0) {
        showGraphPlaceholder("没有可显示的数据。");
        return;
    }

     // Basic check for D3
    if (typeof d3 === 'undefined') {
        showErrorIndicator(dom.networkGraph, "D3库加载失败。");
        return;
    }

    dom.networkGraph.innerHTML = ''; // Clear placeholder or previous graph

    const width = dom.networkGraphContainer.clientWidth || 600;
    const height = dom.networkGraphContainer.clientHeight || 500;

    // Create SVG if it doesn't exist
    if (!d3Objects.svg) {
        d3Objects.svg = d3.select(dom.networkGraph).append("svg")
            .attr("width", width)
            .attr("height", height)
            .attr("viewBox", [0, 0, width, height])
            .style("max-width", "100%")
            .style("height", "auto");

        // Define zoom behavior only once
        d3Objects.zoom = d3.zoom()
            .scaleExtent([0.1, 8])
            .on("zoom", (event) => {
                d3Objects.graphGroup?.attr("transform", event.transform);
            });
        d3Objects.svg.call(d3Objects.zoom);

        // Create main group for zoom/pan
        d3Objects.graphGroup = d3Objects.svg.append("g");

        // Create containers for links and nodes only once
        d3Objects.link = d3Objects.graphGroup.append("g")
            .attr("class", "links")
            .attr("stroke", "#aaa") // Slightly darker links
            .attr("stroke-opacity", 0.6);

        d3Objects.node = d3Objects.graphGroup.append("g")
            .attr("class", "nodes")
            .attr("stroke", "#fff")
            .attr("stroke-width", 1);

    } else {
         // Update SVG size if container resized (simple version)
         d3Objects.svg.attr("width", width).attr("height", height).attr("viewBox", [0, 0, width, height]);
    }


    // Create or update simulation
    if (!d3Objects.simulation) {
        d3Objects.simulation = d3.forceSimulation()
            .force("link", d3.forceLink().id(d => d.id).distance(100).strength(0.5)) // Increased distance slightly
            .force("charge", d3.forceManyBody().strength(-250)) // Stronger repulsion for smaller graphs
            .force("center", d3.forceCenter(width / 2, height / 2))
            .force("collision", d3.forceCollide().radius(d => getNodeRadius(d) + 5)) // Collision based on radius
            .on("tick", ticked);
    }

    // --- Update data binding ---
    const nodesData = currentGraphData.nodes;
    const linksData = currentGraphData.links;

    // Update links
    const linkElements = d3Objects.link
        .selectAll("line")
        .data(linksData, d => `${d.source.id || d.source}-${d.target.id || d.target}`); // Use object IDs if available

    linkElements.exit().remove(); // Remove old links

    linkElements.enter().append("line")
        .attr("stroke-width", 1.2) // Merge styles with update selection if needed
        .merge(linkElements);


    // Update nodes
    const nodeElements = d3Objects.node
        .selectAll("circle")
        .data(nodesData, d => d.id);

    nodeElements.exit().remove(); // Remove old nodes

    const nodeEnter = nodeElements.enter().append("circle")
        .attr("r", getNodeRadius)
        .attr("fill", getNodeColor)
        .call(drag(d3Objects.simulation)) // Apply drag behavior
        .on('mouseover', (event, d) => { // Add hover effect
            d3.select(event.currentTarget).transition().duration(150).attr('r', getNodeRadius(d) * 1.4);
        })
        .on('mouseout', (event, d) => {
            d3.select(event.currentTarget).transition().duration(150).attr('r', getNodeRadius(d));
        });


    nodeEnter.append("title") // Add tooltips
         .text(getNodeTooltip);

    // Merge enter and update selections for attributes that might change
    const allNodeElements = nodeEnter.merge(nodeElements)
         .attr("r", getNodeRadius) // Ensure radius is updated if count changes
         .attr("fill", getNodeColor);


    // --- Restart simulation with new data ---
    d3Objects.simulation.nodes(nodesData);
    d3Objects.simulation.force("link").links(linksData);
    d3Objects.simulation.alpha(0.8).restart(); // Restart simulation with high alpha

    // Reset zoom/pan to fit new graph (optional, can be jarring)
    // d3Objects.svg.transition().duration(500).call(d3Objects.zoom.transform, d3.zoomIdentity);

    console.log("Graph updated/initialized.");
}


// --- D3 Helper Functions ---

function ticked() {
    // Update positions in the tick handler
    if(d3Objects.link) {
        d3Objects.link.selectAll("line")
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);
    }
    if(d3Objects.node) {
        d3Objects.node.selectAll("circle")
            .attr("cx", d => d.x)
            .attr("cy", d => d.y);
    }
}

function drag(simulation) {
    // (This function remains the same as the previous version)
    function dragstarted(event, d) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }
    function dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
    }
    function dragended(event, d) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }
    return d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);
}

function getNodeRadius(d) {
    if (d.isCenter) return 12; // Center node larger
    if (d.type === 'professional') return 7; // Other professionals
    // Interest node size based on count, with min/max
    return Math.max(4, Math.min(4 + Math.sqrt(d.count || 1) * 1.5, 15));
}

function getNodeColor(d) {
    if (d.isCenter) return '#e74c3c'; // Center node red
    if (d.type === 'professional') return '#5dade2'; // Other professionals blue
    return '#f1c40f'; // Interests yellow/orange
}

function getNodeTooltip(d) {
     if (d.type === 'professional') {
         return `${d.name}\n机构: ${d.affiliation || '未知'}`;
     } else { // Interest
         return `研究兴趣: ${d.name}\n关联人数: ${d.count || 0}`;
     }
 }

// --- Utility Functions ---

function showLoadingIndicator(element, message = "加载中...") {
    element.innerHTML = `<div class="loading">${message}</div>`;
}

function showErrorIndicator(element, message = "加载失败。") {
    element.innerHTML = `<div class="error">${message}</div>`;
}

function showInfoIndicator(element, message = "没有数据。") {
     element.innerHTML = `<div class="no-results">${message}</div>`;
}

function formatText(text) {
    // (This function remains largely the same as the previous version)
    if (!text) return '';
    let formatted = text;
    formatted = formatted.replace(/</g, "&lt;").replace(/>/g, "&gt;"); // Basic XSS prevention
    // Simple Markdown - adjust regex if needed
    formatted = formatted.replace(/^### (.*?$)/gm, '<h4>$1</h4>');
    formatted = formatted.replace(/^## (.*?$)/gm, '<h3>$1</h3>');
    formatted = formatted.replace(/^# (.*?$)/gm, '<h2>$1</h2>');
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
    formatted = formatted.replace(/\n/g, '<br>'); // Newlines
    return formatted;
}