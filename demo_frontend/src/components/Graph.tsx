'use client';

import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

// Node interface for simulation nodes
interface Node extends d3.SimulationNodeDatum {
  id: string;
  group: number;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
  index?: number;
}

// Link interface for simulation links
interface Link extends d3.SimulationLinkDatum<Node> {
  source: string | Node;
  target: string | Node;
}

interface GraphProps {
  onNodeClick?: (nodeId: string) => void;
}

const Graph: React.FC<GraphProps> = ({ onNodeClick }) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const graphData = {
    nodes: [
      { id: "Credit Scoring", group: 2 },
      { id: "Micro Formal", group: 5 },
      { id: "Micro Informal", group: 5 },
      { id: "Inventory Finance", group: 5 },
      { id: "Invoice Finance", group: 5 },
      { id: "AgTech", group: 5 },
      { id: "Device and Asset Finance", group: 5 },
      { id: "Buy Now Pay Later", group: 5 },
      { id: "Platforms", group: 3 },
      { id: "APLIQ", group: 5 },
      { id: "ASCENT", group: 5 },
      { id: "COSAP", group: 5 },
      { id: "Agent Network", group: 5 },
      { id: "Decisioning SaaS", group: 5 },
      { id: "Early Warning System", group: 5 },
      { id: "Loan Portfolio Manager", group: 5 },
      { id: "Financial Platforms", group: 4 },
      { id: "IFS", group: 5 },
      { id: "IFS Sharia", group: 5 },
      { id: "Embedded Finance", group: 5 },
      { id: "Invoice Finance (RF and LPO)", group: 5 },
      { id: "Kifiya Tech Ecosystem", group: 1 },
    ],
    links: [
      { source: "Micro Formal", target: "Credit Scoring" },
      { source: "Micro Informal", target: "Credit Scoring" },
      { source: "Inventory Finance", target: "Credit Scoring" },
      { source: "Invoice Finance", target: "Credit Scoring" },
      { source: "AgTech", target: "Credit Scoring" },
      { source: "Device and Asset Finance", target: "Credit Scoring" },
      { source: "Buy Now Pay Later", target: "Credit Scoring" },
      { source: "APLIQ", target: "Platforms" },
      { source: "ASCENT", target: "Platforms" },
      { source: "COSAP", target: "Platforms" },
      { source: "Agent Network", target: "Platforms" },
      { source: "Decisioning SaaS", target: "Platforms" },
      { source: "Early Warning System", target: "Platforms" },
      { source: "Loan Portfolio Manager", target: "Platforms" },
      { source: "IFS", target: "Financial Platforms" },
      { source: "IFS Sharia", target: "Financial Platforms" },
      { source: "Embedded Finance", target: "Financial Platforms" },
      { source: "Invoice Finance (RF and LPO)", target: "Financial Platforms" },
      { source: "Platforms", target: "Kifiya Tech Ecosystem" },
      { source: "Credit Scoring", target: "Kifiya Tech Ecosystem" },
      { source: "Financial Platforms", target: "Kifiya Tech Ecosystem" },
    ],
  };

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const svg = d3.select(svgRef.current);
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    svg.selectAll('*').remove();
    svg.attr('width', width).attr('height', height);

    const simulation = d3
      .forceSimulation<Node>(graphData.nodes)
      .force(
        'link',
        d3
          .forceLink<Node, Link>(graphData.links)
          .id((d) => d.id)
          .distance(110)
      )
      .force('charge', d3.forceManyBody().strength(-100))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .alphaDecay(0)
      .alphaTarget(0.0005);

    const link = svg
      .append('g')
      .attr('stroke', '#aaa')
      .selectAll('line')
      .data(graphData.links)
      .enter()
      .append('line');

    const node = svg
      .append('g')
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .selectAll('circle')
      .data(graphData.nodes)
      .enter()
      .append('circle')
      .attr('r', 24)
      .attr('fill', (d) =>
        d.group === 1
          ? '#ef4444'
          : d.group === 2
          ? '#3b82f6'
          : d.group === 3
          ? '#8b5cf6'
          : d.group === 4
          ? '#6366f1'
          : '#ff7f0e'
      )
      .call(drag(simulation))
      .on('click', (_event, d) => {
        const nodeClickedEvent = new CustomEvent('nodeClicked', {
          detail: d.id,
        });
        window.dispatchEvent(nodeClickedEvent);
        if (onNodeClick) {
          onNodeClick(d.id);
        }
      });

    const label = svg
      .append('g')
      .selectAll('text')
      .data(graphData.nodes)
      .enter()
      .append('text')
      .text((d) => d.id)
      .style('font-size', '12px')
      .style('pointer-events', 'none');

    let time = 0;

    simulation.on('tick', () => {
      time += 0.005;

      link
        .attr('x1', (d) => (typeof d.source === 'string' ? 0 : d.source.x!))
        .attr('y1', (d) => (typeof d.source === 'string' ? 0 : d.source.y!))
        .attr('x2', (d) => (typeof d.target === 'string' ? 0 : d.target.x!))
        .attr('y2', (d) => (typeof d.target === 'string' ? 0 : d.target.y!));

      node.attr('cx', (d) => d.x!).attr('cy', (d) => d.y! + Math.sin(time + (d.index || 0)) * 5);

      label.each(function (d) {
        const node = d as Node;
        let dx = 0;
        let dy = 0;
        const nodeRadius = 18;
        const extraSpacing = 5;
        const offsetDistance = nodeRadius + extraSpacing;

        const connectedLinks = graphData.links.filter(
          (link) =>
            (typeof link.source === 'string' ? link.source : link.source.id) === node.id ||
            (typeof link.target === 'string' ? link.target : link.target.id) === node.id
        );

        if (connectedLinks.length > 0) {
          connectedLinks.forEach((link) => {
            const source = typeof link.source === 'string' ? graphData.nodes.find((n) => n.id === link.source) : link.source;
            const target = typeof link.target === 'string' ? graphData.nodes.find((n) => n.id === link.target) : link.target;
            if (!source || !target) return;

            const otherNode = source.id === node.id ? target : source;
            const linkDx = otherNode.x! - node.x!;
            const linkDy = otherNode.y! - node.y!;
            const distance = Math.sqrt(linkDx * linkDx + linkDy * linkDy) || 1;
            dx += (-linkDx / distance) * offsetDistance;
            dy += (-linkDy / distance) * offsetDistance;
          });
          dx /= connectedLinks.length;
          dy /= connectedLinks.length;
        } else {
          const angle = ((node.index || 0) / graphData.nodes.length) * 2 * Math.PI;
          dx = Math.cos(angle) * offsetDistance;
          dy = Math.sin(angle) * offsetDistance;
        }

        const textAnchor = dx >= 0 ? 'start' : 'end';
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);
        const adjustedAngle = angle > 90 || angle < -90 ? angle + 180 : angle;

        const xPos = node.x! + dx;
        const yPos = node.y! + dy + Math.sin(time + (node.index || 0)) * 5;
        d3.select(this)
          .attr('text-anchor', textAnchor)
          .attr('x', xPos)
          .attr('y', yPos)
          .attr('transform', `rotate(${adjustedAngle}, ${xPos}, ${yPos})`);
      });
    });

    function drag(sim: d3.Simulation<Node, undefined>) {
      function dragstarted(event: d3.DragEvent, d: Node) {
        if (!event.active) {
          sim.alphaTarget(0.3).restart();
        }
        d.fx = d.x;
        d.fy = d.y;
      }

      function dragged(event: d3.DragEvent, d: Node) {
        d.fx = event.x;
        d.fy = event.y;
      }

      function dragended(event: d3.DragEvent, d: Node) {
        if (!event.active) {
          sim.alphaTarget(0.005);
        }
        d.fx = null;
        d.fy = null;
      }

      return d3
        .drag<SVGCircleElement, Node>()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended);
    }

    const handleResize = () => {
      if (containerRef.current) {
        const newWidth = containerRef.current.clientWidth;
        const newHeight = containerRef.current.clientHeight;
        svg.attr('width', newWidth).attr('height', newHeight);
        simulation.force('center', d3.forceCenter(newWidth / 2, newHeight / 2));
        simulation.alpha(0.3).restart();
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      simulation.stop();
      window.removeEventListener('resize', handleResize);
    };
  }, [onNodeClick]);

  return (
    <div ref={containerRef} className="graph-container">
      <svg ref={svgRef}></svg>
    </div>
  );
};

export default Graph;