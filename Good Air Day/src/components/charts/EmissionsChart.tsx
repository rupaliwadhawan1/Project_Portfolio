import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { EmissionsData } from '../../services/emissionsService';

interface EmissionsChartProps {
  data: EmissionsData[];
  height?: number;
}

export function EmissionsChart({ data, height = 300 }: EmissionsChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !data.length) return;

    const svg = d3.select(svgRef.current);
    const margin = { top: 20, right: 30, bottom: 40, left: 60 };
    const width = svgRef.current.clientWidth - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    svg.selectAll("*").remove();

    const x = d3.scaleBand()
      .domain(data.map(d => d.vehicleType))
      .range([margin.left, width])
      .padding(0.1);

    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.co2e) || 0])
      .nice()
      .range([chartHeight, margin.top]);

    const g = svg.append("g");

    // Add bars
    g.selectAll("rect")
      .data(data)
      .join("rect")
      .attr("x", d => x(d.vehicleType) || 0)
      .attr("y", d => y(d.co2e))
      .attr("width", x.bandwidth())
      .attr("height", d => chartHeight - y(d.co2e))
      .attr("fill", "#60a5fa")
      .attr("rx", 4)
      .on("mouseover", function(event, d) {
        d3.select(this).attr("fill", "#3b82f6");
        tooltip.style("opacity", 1);
        tooltip.html(`${d.vehicleType}<br>${d.co2e.toFixed(2)} kg CO₂e`)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", function() {
        d3.select(this).attr("fill", "#60a5fa");
        tooltip.style("opacity", 0);
      });

    // Add axes
    svg.append("g")
      .attr("transform", `translate(0,${chartHeight})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end");

    svg.append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).ticks(5).tickFormat(d => `${d}kg`));

    // Add y-axis label
    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", margin.left / 3)
      .attr("x", -chartHeight / 2)
      .attr("text-anchor", "middle")
      .attr("fill", "currentColor")
      .attr("class", "text-sm")
      .text("CO₂ Equivalent (kg)");

    // Add tooltip
    const tooltip = d3.select("body").append("div")
      .attr("class", "tooltip")
      .style("opacity", 0)
      .style("position", "absolute")
      .style("background-color", "white")
      .style("padding", "10px")
      .style("border-radius", "5px")
      .style("font-size", "12px")
      .style("box-shadow", "0 2px 4px rgba(0,0,0,0.1)");

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