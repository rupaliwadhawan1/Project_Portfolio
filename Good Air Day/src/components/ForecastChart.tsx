import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface ForecastData {
  timestamp: string;
  value: number;
  confidence: {
    lower: number;
    upper: number;
  };
}

interface ForecastChartProps {
  data: ForecastData[];
  height?: number;
}

export function ForecastChart({ data, height = 300 }: ForecastChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !data.length) return;

    const svg = d3.select(svgRef.current);
    const margin = { top: 20, right: 30, bottom: 30, left: 40 };
    const width = svgRef.current.clientWidth - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    svg.selectAll("*").remove();

    const x = d3.scaleTime()
      .domain(d3.extent(data, d => new Date(d.timestamp)) as [Date, Date])
      .range([margin.left, width - margin.right]);

    const y = d3.scaleLinear()
      .domain([
        d3.min(data, d => d.confidence.lower) || 0,
        d3.max(data, d => d.confidence.upper) || 0
      ])
      .nice()
      .range([chartHeight - margin.bottom, margin.top]);

    const line = d3.line<ForecastData>()
      .x(d => x(new Date(d.timestamp)))
      .y(d => y(d.value));

    const area = d3.area<ForecastData>()
      .x(d => x(new Date(d.timestamp)))
      .y0(d => y(d.confidence.lower))
      .y1(d => y(d.confidence.upper));

    // Add confidence interval area
    svg.append("path")
      .datum(data)
      .attr("fill", "rgb(59, 130, 246)")
      .attr("fill-opacity", 0.2)
      .attr("d", area);

    // Add the line
    svg.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "rgb(59, 130, 246)")
      .attr("stroke-width", 2)
      .attr("d", line);

    // Add axes
    svg.append("g")
      .attr("transform", `translate(0,${chartHeight - margin.bottom})`)
      .call(d3.axisBottom(x));

    svg.append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y));

    // Add dots
    svg.selectAll(".dot")
      .data(data)
      .enter()
      .append("circle")
      .attr("class", "dot")
      .attr("cx", d => x(new Date(d.timestamp)))
      .attr("cy", d => y(d.value))
      .attr("r", 4)
      .attr("fill", "rgb(59, 130, 246)");

  }, [data, height]);

  return (
    <div className="w-full">
      <svg ref={svgRef} className="w-full" style={{ height }}></svg>
    </div>
  );
}