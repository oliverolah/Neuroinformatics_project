import {
  forceSimulation,
  forceManyBody,
  forceLink,
  forceCenter,
} from 'https://cdn.skypack.dev/d3-force@3';

const svg = d3.select('#data-vis-container'),
  width = +svg.attr('width'),
  height = +svg.attr('height');

svg.attr('viewBox', '0 0 ' + width + ' ' + height)
  .attr('preserveAspectRatio', 'xMinYMin');

const centerX = width / 2,
  centerY = height / 2;

const nodeRadius = 6;

// const nodeColor = d3.scaleOrdinal(d3.schemeSet3);
// const nodeColor = 'rgb(201,234,255)',
const nodeColorGroupPh = '#f9806f', // Pharynx
  nodeColorGroupIn = '#8dd3c2', // Interneuron
  nodeColorGroupSn = '#fbfbb5', // Sensory neuron
  nodeColorGroupMn = '#c0bcde', // Motor neuron
  gapLinkColorOrange = 'rgba(255,127,1,255)', // color for GAP-type links
  synLinkColorBlue = 'rgba(23,118,182,255)'; // color for SYN-type links

d3.json(dataFile).then(function (data) {

  const simulation = forceSimulation()
    .nodes(data.nodes)
    .force('charge', forceManyBody().strength(-40))
    .force('link', forceLink(data.links).id((d) => d.id))
    .force('center', forceCenter(centerX, centerY))
    .force('forceX', d3.forceX(-1))
    .force('forceY', d3.forceY(-1))
    .force('collide', d3.forceCollide(10));
  
  // node tooltip
  const nodeTooltip = d3
    .select('#data-vis-wrapper')
    .append('div')
    .style('visibility', 'hidden')
    .attr('class', 'tooltip');

  const tooltipIn = (event, d) => {
    return nodeTooltip
      .html(
        '<h3>Neuron name:</h3>' + '<span>' + d.id + '</span>' + 
        '<h3>Neuron class:</h3>' + '<span>' + d.className + '</span>' + 
        '<h3>Neuron type:</h3>' + '<span>' + d.neuronTypeName + '</span>'
      )
      .style('visibility', 'visible') 
      .style('top', event.pageY + 'px') 
      .style('left', event.pageX + 'px')
  }

  const tooltipOut = () => {
    return nodeTooltip
      .transition()
      .duration(50)
      .style('visibility', 'hidden')
  }

  const link = svg
    .selectAll('line')
    .data(data.links)
    .enter()
    .append('line')
    .attr('opacity', 0.3)
    .style('stroke', (d) => {
      if (d.edgeTypeName === 'syn') {
        return synLinkColorBlue; // syn link
      } else {
        return gapLinkColorOrange; // gap link
      }
    })
    .attr('stroke-width', (d) => { return Math.sqrt(d.numOfEdges); });
  
  const node = svg
    .attr('class', 'nodes')
    .selectAll('circles')
    .data(data.nodes)
    .enter()
    .append('circle')
    .attr('r', nodeRadius)
    .style('stroke', 'black')
    .style('stroke-width', 2)
    .attr('fill', (d) => {
      if (d.neuronTypeName === 'PHARYNX') {
        return nodeColorGroupPh;
      } else if (d.neuronTypeName === 'INTERNEURON') {
        return nodeColorGroupIn;
      } else if (d.neuronTypeName === 'SENSORY_NEURON') {
        return nodeColorGroupSn;
      } else {
        return nodeColorGroupMn;
      }
    })
    .on('mouseover', tooltipIn)
    .on('mouseout', tooltipOut)
    .call(nodeDragging(simulation))
    .on('dblclick', connectedNodes);
  
  simulation.on('tick', ticked);

  function ticked() {

    node
      // this two lines of code below keep all nodes within the boundaries of the vis container even when being dragged
      .attr('cx', (nd) => { return nd.x = Math.max(nodeRadius, Math.min(width - nodeRadius, nd.x)); }) // nd => node
      .attr('cy', (nd) => { return nd.y = Math.max(nodeRadius, Math.min(height - nodeRadius, nd.y)); }); 
  
    link
      .attr('x1', (lk) => lk.source.x) // lk => link
      .attr('y1', (lk) => lk.source.y)
      .attr('x2', (lk) => lk.target.x)
      .attr('y2', (lk) => lk.target.y);
  };
  

  // Fading & highlighting of nodes & links
  let toggle = 0; // Toggle stores whether the highlighting is on
  let linkedByIndex = {}; // Create an array logging what is connected to what

  for (let i = 0; i < data.nodes.length; i++) {
    linkedByIndex[i + ',' + i] = 1;
  };

  data.links.forEach((d) => {
    linkedByIndex[d.source.index + ',' + d.target.index] = 1;
  });

  // This function looks up whether a pair are neighbours
  function neighborNodes(a, b) {
    return linkedByIndex[a.index + ',' + b.index];
  };

  function connectedNodes() {
    if (toggle === 0) {
      let d = d3.select(this).node().__data__; // Reduce the opacity of all but the neighbouring nodes
      node.style('opacity', (o) => {
        return neighborNodes(d, o) || neighborNodes(o, d) ? 1 : 0.1;
      });
      link.style('opacity',(o) => {
        return d.index === o.source.index || d.index === o.target.index ? 1 : 0.1;
      });
      toggle = 1; // Reduce the op
    } else {
      // Put them back to initial opacity
      node.style('opacity', 1);
      link.style('opacity', .3);
      toggle = 0;
    }
  };


  // Code from observable, all credits to d3js-team. Source: https://observablehq.com/@d3/zoom
  // visualisation zooming
  // svg.call(d3.zoom()
  //     .extent([[0, 0], [width, height]])
  //     .scaleExtent([0, 8])
  //     .on('zoom', zoomed));

  // function zoomed({transform}) {
  //   node.attr('transform', transform);
  //   link.attr('transform', transform);
  // };

  return svg.canvas;

}).catch((err) => alert(err.message));

// Code from observable, all credits to d3js-team. Source: https://observablehq.com/@d3/force-directed-graph
// node dragging 
function nodeDragging(simulation) {    
  function dragStarted(event) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    event.subject.fx = event.subject.x;
    event.subject.fy = event.subject.y;
  }
  
  function dragged(event) {
    event.subject.fx = event.x;
    event.subject.fy = event.y;
  }
  
  function dragEnded(event) {
    if (!event.active) simulation.alphaTarget(0);
    event.subject.fx = null;
    event.subject.fy = null;
  }
  
  return d3.drag()
    .on('start', dragStarted)
    .on('drag', dragged)
    .on('end', dragEnded);
};