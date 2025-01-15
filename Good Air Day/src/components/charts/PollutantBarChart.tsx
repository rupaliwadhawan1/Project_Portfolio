import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface PollutantData {
  name: string;
  value: number;
  unit: string;
}

interface PollutantBarChartProps {
  data: PollutantData[];
  height?: number;
}

export function PollutantBarChart({ data, height = 400 }: PollutantBarChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !data.length) return;

    const svg = d3.select(svgRef.current);
    const margin = { top: 30, right: 30, bottom: 60, left: 70 };
    const width = svgRef.current.clientWidth - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    svg.selectAll("*").remove();

    // Create gradient for bars
    const gradient = svg.append("defs")
      .append("linearGradient")
      .attr("id", "bar-gradient")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "0%")
      .attr("y2", "100%");

    gradient.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "#875b89");

    gradient.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#6e3972");

    const x = d3.scaleBand()
      .domain(data.map(d => d.name))
      .range([margin.left, width])
      .padding(0.3);

    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.value) || 0])
      .nice()
      .range([chartHeight - margin.bottom, margin.top]);

    // Add grid lines
    svg.append("g")
      .attr("class", "grid")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y)
        .tickSize(-width + margin.left + margin.right)
        .tickFormat(() => ""))
      .style("stroke-dasharray", "3,3")
      .style("stroke-opacity", 0.2);

    // Add bars with animation
    svg.selectAll("rect")
      .data(data)
      .join("rect")
      .attr("x", d => x(d.name) || 0)
      .attr("y", chartHeight - margin.bottom)
      .attr("width", x.bandwidth())
      .attr("height", 0)
      .attr("fill", "url(#bar-gradient)")
      .attr("rx", 4)
      .transition()
      .duration(1000)
      .delay((_, i) => i * 100)
      .attr("y", d => y(d.value))
      .attr("height", d => chartHeight - margin.bottom - y(d.value));

    // Add axes with styled ticks and labels
    const xAxis = svg.append("g")
      .attr("transform", `translate(0,${chartHeight - margin.bottom})`)
      .call(d3.axisBottom(x));

    const yAxis = svg.append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y));

    // Style axes
    svg.selectAll(".domain")
      .style("stroke", "#a07da1");
    svg.selectAll(".tick line")
      .style("stroke", "#a07da1");
    svg.selectAll(".tick text")
      .style("fill", "#6e3972")
      .style("font-size", "12px");

    // Rotate x-axis labels
    xAxis.selectAll("text")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end")
      .attr("dx", "-0.8em")
      .attr("dy", "0.15em");

    // Add axis labels
    svg.append("text")
      .attr("transform", `translate(${width/2},${height - 10})`)
      .style("text-anchor", "middle")
      .style("fill", "#6e3972")
      .style("font-size", "14px")
      .text("Pollutants");

    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 15)
      .attr("x", -chartHeight/2)
      .style("text-anchor", "middle")
      .style("fill", "#6e3972")
      .style("font-size", "14px")
      .text("Concentration");

    // Add interactive tooltip
    const tooltip = d3.select("body").append("div")
      .attr("class", "tooltip")
      .style("opacity", 0)
      .style("position", "absolute")
      .style("background-color", "white")
      .style("padding", "8px 12px")
      .style("border-radius", "6px")
      .style("font-size", "12px")
      .style("box-shadow", "0 2px 4px rgba(0,0,0,0.1)")
      .style("pointer-events", "none")
      .style("z-index", "100");

    // Add interactivity
    svg.selectAll("rect")
      .on("mouseover", function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("opacity", 0.8);

        tooltip.transition()
          .duration(200)
          .style("opacity", 1);

        tooltip.html(`
          <div style="color: #6e3972;">
            <strong>${d.name}</strong><br/>
            <span>${d.value.toFixed(2)} ${d.unit}</span>
          </div>
        `)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", function() {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("opacity", 1);

        tooltip.transition()
          .duration(500)
          .style("opacity", 0);
      });

    return () => {
      tooltip.remove();
    };
  }, [data, height]);

  return (
    <div className="w-full">
      <svg ref={svgRef} className="w-full" style={{ height }}></svg>
    </div>
  );
}