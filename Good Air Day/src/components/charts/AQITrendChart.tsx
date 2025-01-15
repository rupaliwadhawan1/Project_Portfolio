import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { useResizeObserver } from '../../hooks/useResizeObserver';

interface AQITrendChartProps {
  data: Array<{
    timestamp: string;
    value: number;
  }>;
}

export function AQITrendChart({ data }: AQITrendChartProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const dimensions = useResizeObserver(wrapperRef);

  useEffect(() => {
    if (!svgRef.current || !dimensions || !data.length) return;

    const margin = {
      top: 10,
      right: 30,
      bottom: 30,
      left: 40
    };

    const width = dimensions.width - margin.left - margin.right;
    const height = dimensions.height - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Create gradient
    const gradient = svg.append("defs")
      .append("linearGradient")
      .attr("id", "aqi-area-gradient")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "0%")
      .attr("y2", "100%");

    gradient.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "#6e3972")
      .attr("stop-opacity", 0.3);

    gradient.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#6e3972")
      .attr("stop-opacity", 0.05);

    const x = d3.scaleTime()
      .domain(d3.extent(data, d => new Date(d.timestamp)) as [Date, Date])
      .range([margin.left, width]);

    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.value) || 0])
      .nice()
      .range([height, margin.top]);

    // Add grid lines with reduced opacity
    svg.append("g")
      .attr("class", "grid")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x)
        .tickSize(-height)
        .tickFormat(() => ""))
      .style("stroke-dasharray", "3,3")
      .style("stroke-opacity", 0.1);

    svg.append("g")
      .attr("class", "grid")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y)
        .tickSize(-width + margin.left + margin.right)
        .tickFormat(() => ""))
      .style("stroke-dasharray", "3,3")
      .style("stroke-opacity", 0.1);

    // Create the area
    const area = d3.area<typeof data[0]>()
      .x(d => x(new Date(d.timestamp)))
      .y0(height)
      .y1(d => y(d.value))
      .curve(d3.curveMonotoneX);

    // Add the area
    svg.append("path")
      .datum(data)
      .attr("fill", "url(#aqi-area-gradient)")
      .attr("d", area);

    // Add the line
    const line = d3.line<typeof data[0]>()
      .x(d => x(new Date(d.timestamp)))
      .y(d => y(d.value))
      .curve(d3.curveMonotoneX);

    const path = svg.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "#6e3972")
      .attr("stroke-width", 2)
      .attr("d", line);

    // Add axes with responsive font sizes
    const fontSize = Math.max(10, Math.min(12, width / 80));

    const xAxis = svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x)
        .ticks(width > 600 ? 10 : 5)
        .tickFormat(d => d3.timeFormat("%H:%M")(d as Date)));

    const yAxis = svg.append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y)
        .ticks(height > 300 ? 10 : 5));

    // Style axes
    svg.selectAll(".domain")
      .style("stroke", "#a07da1");
    svg.selectAll(".tick line")
      .style("stroke", "#a07da1");
    svg.selectAll(".tick text")
      .style("fill", "#6e3972")
      .style("font-size", `${fontSize}px`);

    // Add responsive tooltips
    const tooltip = d3.select("body").append("div")
      .attr("class", "tooltip")
      .style("opacity", 0)
      .style("position", "absolute")
      .style("background-color", "white")
      .style("padding", "8px")
      .style("border-radius", "4px")
      .style("font-size", `${fontSize}px`)
      .style("box-shadow", "0 2px 4px rgba(0,0,0,0.1)")
      .style("pointer-events", "none")
      .style("z-index", "100");

    // Add interactive dots
    const dots = svg.selectAll(".dot")
      .data(data)
      .enter()
      .append("circle")
      .attr("class", "dot")
      .attr("cx", d => x(new Date(d.timestamp)))
      .attr("cy", d => y(d.value))
      .attr("r", width > 600 ? 4 : 3)
      .attr("fill", "#4B5563")
      .attr("stroke", "white")
      .attr("stroke-width", 2)
      .style("opacity", 0)
      .on("mouseover", function(event, d) {
        const dot = d3.select(this);
        dot.transition()
          .duration(200)
          .attr("r", width > 600 ? 6 : 4);

        tooltip.transition()
          .duration(200)
          .style("opacity", 1);

        tooltip.html(`
          <div style="color: #6e3972;">
            <strong>NAQI: ${d.value}</strong><br/>
            <span>${new Date(d.timestamp).toLocaleString()}</span>
          </div>
        `)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", function() {
        const dot = d3.select(this);
        dot.transition()
          .duration(200)
          .attr("r", width > 600 ? 4 : 3);

        tooltip.transition()
          .duration(500)
          .style("opacity", 0);
      });

    // Animate dots appearance
    dots.transition()
      .delay((_, i) => i * 50)
      .style("opacity", 1);

    return () => {
      tooltip.remove();
    };
  }, [data, dimensions]);

  return (
    <div ref={wrapperRef} className="w-full h-[300px]">
      <svg ref={svgRef} className="w-full h-full" />
    </div>
  );
}