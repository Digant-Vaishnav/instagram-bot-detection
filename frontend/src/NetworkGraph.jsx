import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

export default function NetworkGraph({ target, followers, isBot }) {
  const svgRef = useRef(null);
  const [tooltip, setTooltip] = useState({ visible: false, text: "", x: 0, y: 0 });

  useEffect(() => {
    if (!svgRef.current || !followers || followers.length === 0) return;

    const container = svgRef.current.parentElement;
    const width = container.clientWidth || 800;
    const height = 500;

    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3
      .select(svgRef.current)
      .attr("viewBox", [0, 0, width, height])
      .attr("width", "100%")
      .attr("height", height);

    const g = svg.append("g");

    // Smooth Zoom & Pan
    svg.call(
      d3.zoom().scaleExtent([0.4, 3]).on("zoom", (event) => {
        g.attr("transform", event.transform);
      })
    );

    // Build Graph Data
    const nodes = [
      { id: target, group: "target", radius: 22 },
      ...followers.map((f, i) => ({
        id: f,
        group: "follower",
        radius: Math.floor(Math.random() * 5) + 7, // Varied natural bubble sizes
        seed: i,
      })),
    ];

    const links = followers.map((f) => ({
      source: target,
      target: f,
      strength: 0.15 + Math.random() * 0.2,
      distance: 80 + Math.random() * 120, // Varied floating distances
    }));

    // Natural Floating Physics Simulation
    const simulation = d3
      .forceSimulation(nodes)
      .force(
        "link",
        d3
          .forceLink(links)
          .id((d) => d.id)
          .distance((d) => d.distance)
          .strength((d) => d.strength)
      )
      .force("charge", d3.forceManyBody().strength(-120))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius((d) => d.radius + 12))
      .velocityDecay(0.3); // Enables floating drift feel

    // Link Lines
    const link = g
      .append("g")
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke", isBot ? "rgba(239, 68, 68, 0.25)" : "rgba(56, 189, 248, 0.25)")
      .attr("stroke-width", 1.2)
      .attr("stroke-dasharray", "3,3");

    // Glow Filter for Target
    const defs = svg.append("defs");
    const filter = defs.append("filter").attr("id", "glow");
    filter.append("feGaussianBlur").attr("stdDeviation", "4").attr("result", "coloredBlur");
    const feMerge = filter.append("feMerge");
    feMerge.append("feMergeNode").attr("in", "coloredBlur");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");

    // Node Circles
    const node = g
      .append("g")
      .selectAll("circle")
      .data(nodes)
      .join("circle")
      .attr("r", (d) => d.radius)
      .attr("fill", (d) => {
        if (d.group === "target") {
          return isBot ? "#ef4444" : "#10b981"; // Red if bot, Green if real
        }
        return "#334155";
      })
      .attr("stroke", (d) => {
        if (d.group === "target") return "#ffffff";
        return "#64748b";
      })
      .attr("stroke-width", (d) => (d.group === "target" ? 2.5 : 1))
      .attr("filter", (d) => (d.group === "target" ? "url(#glow)" : null))
      .style("cursor", "pointer")
      .on("mouseenter", (event, d) => {
        d3.select(event.currentTarget)
          .transition()
          .duration(150)
          .attr("r", d.radius + 4)
          .attr("fill", d.group === "target" ? (isBot ? "#f87171" : "#34d399") : "#38bdf8");

        const rect = container.getBoundingClientRect();
        setTooltip({
          visible: true,
          text: `@${d.id}${d.group === "target" ? "(Target)" : "(Sampled Follower)"}`,
          x: event.clientX - rect.left,
          y: event.clientY - rect.top - 35,
        });
      })
      .on("mousemove", (event) => {
        const rect = container.getBoundingClientRect();
        setTooltip((prev) => ({
          ...prev,
          x: event.clientX - rect.left,
          y: event.clientY - rect.top - 35,
        }));
      })
      .on("mouseleave", (event, d) => {
        d3.select(event.currentTarget)
          .transition()
          .duration(150)
          .attr("r", d.radius)
          .attr("fill", d.group === "target" ? (isBot ? "#ef4444" : "#10b981") : "#334155");

        setTooltip({ visible: false, text: "", x: 0, y: 0 });
      })
      .call(
        d3
          .drag()
          .on("start", (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on("drag", (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on("end", (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          })
      );

    // Target Label
    g.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", 36)
      .attr("fill", "#f8fafc")
      .attr("font-size", "11px")
      .attr("font-weight", "600")
      .text(`@${target}`);

    simulation.on("tick", () => {
      link
        .attr("x1", (d) => d.source.x)
        .attr("y1", (d) => d.source.y)
        .attr("x2", (d) => d.target.x)
        .attr("y2", (d) => d.target.y);

      node.attr("cx", (d) => d.x).attr("cy", (d) => d.y);
    });

    return () => simulation.stop();
  }, [target, followers, isBot]);

  return (
    <div className="graph-wrapper">
      <svg ref={svgRef}></svg>
      {tooltip.visible && (
        <div
          className="graph-tooltip"
          style={{ left: `${tooltip.x}px`, top: `${tooltip.y}px` }}
        >
          {tooltip.text}
        </div>
      )}
    </div>
  );
}